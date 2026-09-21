const ReservationsService = require("../services/reservations.service");
const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const HousekeepingTask = require("../models/HousekeepingTask");
const AuditLog = require("../models/AuditLog");
const Invoice = require("../models/Invoice");
const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");
const crypto = require("crypto");
const OCRService = require("../services/ocr.service");

class ReservationsController {
  static async getAll(req, res, next) {
    try {
      const reservations = await ReservationsService.listReservations({
        tenant: req.tenant,
        filters: req.query,
        user: req.user,
      });
      return res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const reservation = await Reservation.findOne({ id: req.params.id });
      if (!reservation) {
        return res.status(404).json({ success: false, message: "Reservation not found" });
      }
      return res.status(200).json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const reservation = await ReservationsService.createReservation({
        data: req.body,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(201).json({
        success: true,
        message: "Reservation confirmed successfully",
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const reservation = await ReservationsService.updateStatus({
        id: req.params.id,
        status: req.body.status,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(200).json({
        success: true,
        message: `Reservation status updated to ${req.body.status}`,
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Front Desk: Complete Check-In with ID Capture & Deposit ---
  static async checkIn(req, res) {
    try {
      const { id } = req.params;
      const { idType, idNumber, idDocUrl, advanceDeposit = 0, paymentMethod = "Cash" } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      if (resv.status === "checked_in") {
        if (idType) resv.idType = idType;
        if (idNumber) resv.idNumber = idNumber;
        if (idDocUrl) resv.idDocUrl = idDocUrl;
        await resv.save();
        return res.status(200).json({
          success: true,
          message: `Guest ${resv.guestName} is checked in (Room ${resv.roomNumber})`,
          data: resv,
        });
      }

      // Check room assignment
      if (!resv.roomNumber || resv.roomNumber === "TBD") {
        return res.status(400).json({ success: false, message: "Please assign a room before check-in." });
      }

      // Update room status to occupied
      const cleanRoomNum = String(resv.roomNumber || "").replace(/room\s*/i, "").trim();
      const roomMatch = {
        number: { $in: [cleanRoomNum, `Room ${cleanRoomNum}`, resv.roomNumber] },
        ...(resv.hotelId ? { hotelId: resv.hotelId } : resv.orgId ? { orgId: resv.orgId } : {}),
      };
      await Room.updateMany(roomMatch, { status: "occupied", guest: resv.guestName });

      // Save ID details
      if (idType) resv.idType = idType;
      if (idNumber) resv.idNumber = idNumber;
      if (idDocUrl) resv.idDocUrl = idDocUrl;

      resv.status = "checked_in";
      resv.actualCheckIn = new Date();

      // Record advance deposit if provided
      if (Number(advanceDeposit) > 0) {
        resv.payments.push({
          amount: Number(advanceDeposit),
          method: paymentMethod,
          date: new Date(),
          status: "captured",
          note: "Check-in Advance Deposit",
        });
        resv.paidAmount = (resv.paidAmount || 0) + Number(advanceDeposit);
      }

      await resv.save();

      // Auto-record Advance Deposit in active Cashier Shift
      if (Number(advanceDeposit) > 0) {
        try {
          const activeShift = await CashShift.findOne({
            status: "open",
            ...(resv.hotelId ? { hotelId: resv.hotelId } : {}),
          }).sort({ createdAt: -1 });

          if (activeShift) {
            await CashTransaction.create({
              transactionId: `TXN-CHK-${Date.now().toString().slice(-6)}`,
              shiftId: activeShift.shiftId,
              hotelId: resv.hotelId || activeShift.hotelId,
              hotelName: resv.hotelName || activeShift.hotelName,
              orgId: resv.orgId || activeShift.orgId,
              type: "cash_in",
              category: "room_payment",
              amount: Number(advanceDeposit),
              description: `Check-in Advance Deposit for Res #${resv.id} (${resv.guestName} - Room ${resv.roomNumber}) via ${paymentMethod}`,
              referenceId: resv.id,
              recordedBy: req.user?.name || "Front Desk Receptionist",
            });
          }
        } catch (txErr) {
          console.error("Check-in CashTransaction auto-link error:", txErr);
        }
      }

      // Audit Log
      try {
        await AuditLog.create({
          userId: req.user?.id || req.user?.userId || "system",
          user: req.user?.name || "Front Desk",
          action: "CHECK_IN",
          resource: `Reservation #${resv.id}`,
          oldValue: "confirmed",
          newValue: `checked_in (Room ${resv.roomNumber})`,
          ip: req.ip || "127.0.0.1",
          device: req.headers["user-agent"] || "Web",
        });
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: `Guest ${resv.guestName} successfully checked into Room ${resv.roomNumber}`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Front Desk: Complete Check-Out with Folio Settlement ---
  static async checkOut(req, res) {
    try {
      const { id } = req.params;
      const { finalPaymentAmount = 0, paymentMethod = "Cash", lateCheckOutFee = 0 } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      if (resv.status !== "checked_in") {
        return res.status(400).json({ success: false, message: "Reservation is not currently in checked_in status" });
      }

      // Add late checkout fee if applicable
      if (Number(lateCheckOutFee) > 0) {
        resv.lateCheckOutFee = Number(lateCheckOutFee);
        if (!resv.folioCharges) resv.folioCharges = [];
        resv.folioCharges.push({
          description: "Late Check-Out Fee",
          department: "Services",
          amount: Number(lateCheckOutFee),
          date: new Date(),
        });
        resv.totalAmount = (resv.totalAmount || 0) + Number(lateCheckOutFee);
      }

      // Record final payment
      if (Number(finalPaymentAmount) > 0) {
        if (!resv.payments) resv.payments = [];
        resv.payments.push({
          amount: Number(finalPaymentAmount),
          method: paymentMethod,
          date: new Date(),
          status: "captured",
          note: "Check-out Final Balance Settlement",
        });
        resv.paidAmount = (resv.paidAmount || 0) + Number(finalPaymentAmount);
      }

      resv.status = "checked_out";
      resv.actualCheckOut = new Date();
      await resv.save();

      // Free room -> Mark as Dirty in Room inventory & create Housekeeping Turnover Task
      if (resv.roomNumber && resv.roomNumber !== "TBD") {
        const cleanRoomNum = String(resv.roomNumber || "").replace(/room\s*/i, "").trim();
        const roomMatch = {
          number: { $in: [cleanRoomNum, `Room ${cleanRoomNum}`, resv.roomNumber] },
          ...(resv.hotelId ? { hotelId: resv.hotelId } : resv.orgId ? { orgId: resv.orgId } : {}),
        };
        await Room.updateMany(roomMatch, {
          status: "dirty",
          guest: null,
          housekeepingStatus: "dirty",
          cleaner: "Turnover Required",
        });

        // Upsert / Create Housekeeping Task
        const existingTask = await HousekeepingTask.findOne({
          roomNumber: cleanRoomNum,
          ...(resv.hotelId ? { hotelId: resv.hotelId } : {}),
        });

        if (existingTask) {
          existingTask.status = "dirty";
          existingTask.priority = "high";
          existingTask.assignedTo = "Unassigned";
          existingTask.lastCleaned = "Turnover Required (Guest Checked Out)";
          await existingTask.save();
        } else {
          await HousekeepingTask.create({
            id: `hk-${cleanRoomNum}-${Date.now().toString().slice(-4)}`,
            roomNumber: cleanRoomNum,
            roomType: resv.roomType || "Standard Room",
            floor: Number(cleanRoomNum[0]) || 1,
            status: "dirty",
            priority: "high",
            assignedTo: "Unassigned",
            lastCleaned: "Turnover Required (Guest Checked Out)",
            hotelId: resv.hotelId || "",
            hotelName: resv.hotelName || "",
            orgId: resv.orgId || "",
          });
        }
      }

      // Auto-record Final Payment in active Cashier Shift & create Invoice
      try {
        const activeShift = await CashShift.findOne({
          status: "open",
          ...(resv.hotelId ? { hotelId: resv.hotelId } : {}),
        }).sort({ createdAt: -1 });

        if (Number(finalPaymentAmount) > 0 && activeShift) {
          await CashTransaction.create({
            transactionId: `TXN-CO-${Date.now().toString().slice(-6)}`,
            shiftId: activeShift.shiftId,
            hotelId: resv.hotelId || activeShift.hotelId,
            hotelName: resv.hotelName || activeShift.hotelName,
            orgId: resv.orgId || activeShift.orgId,
            type: "cash_in",
            category: "room_payment",
            amount: Number(finalPaymentAmount),
            description: `Check-out Settlement for Res #${resv.id} (${resv.guestName} - Room ${resv.roomNumber}) via ${paymentMethod}`,
            referenceId: resv.id,
            recordedBy: req.user?.name || "Front Desk Cashier",
          });
        }

        // Auto-create Paid Invoice
        await Invoice.create({
          id: `INV-${Date.now().toString().slice(-4)}`,
          guest: resv.guestName,
          room: String(resv.roomNumber),
          amount: resv.totalAmount || (resv.paidAmount || 0),
          status: "paid",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          hotelId: resv.hotelId || "",
          hotelName: resv.hotelName || "Main Property",
          paymentMethod: paymentMethod || "Cash",
          paidAt: new Date(),
          transactionRef: `TXN-CHKOUT-${Date.now()}`,
          orgId: resv.orgId || "",
          billedBy: req.user?.name || "Front Desk Cashier",
          billedByRole: req.user?.role || "receptionist",
        });
      } catch (invErr) {
        console.error("Check-out invoice/cash auto-link error:", invErr);
      }

      // Audit Log
      try {
        await AuditLog.create({
          userId: req.user?.id || req.user?.userId || "system",
          user: req.user?.name || "Front Desk",
          action: "CHECK_OUT",
          resource: `Reservation #${resv.id}`,
          oldValue: `checked_in (Room ${resv.roomNumber})`,
          newValue: "checked_out",
          ip: req.ip || "127.0.0.1",
          device: req.headers["user-agent"] || "Web",
        });
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: `Guest ${resv.guestName} checked out successfully. Room ${resv.roomNumber} marked as Dirty for housekeeping.`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Folio: Charge Item to Room ---
  static async chargeFolio(req, res) {
    try {
      const { id } = req.params;
      const { description, department = "Room Service", amount, tax = 0, refId } = req.body;

      if (!description || !amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Description and positive amount required" });
      }

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      const totalItemCharge = Number(amount) + Number(tax);
      resv.folioCharges.push({
        description,
        department,
        amount: Number(amount),
        tax: Number(tax),
        date: new Date(),
        refId: refId || null,
      });

      resv.totalAmount = (resv.totalAmount || 0) + totalItemCharge;
      await resv.save();

      return res.status(200).json({
        success: true,
        message: `Charged ₹${totalItemCharge} (${description}) to room folio #${resv.roomNumber}`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Folio: Record Partial / Advance Payment ---
  static async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, method = "Cash", transactionId = "", note = "" } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Valid payment amount required" });
      }

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      resv.payments.push({
        amount: Number(amount),
        method,
        transactionId,
        date: new Date(),
        status: "captured",
        note,
      });

      resv.paidAmount = (resv.paidAmount || 0) + Number(amount);
      await resv.save();

      return res.status(200).json({
        success: true,
        message: `Payment of ₹${amount} recorded via ${method}`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Customer Portal: Digital Pre-Check-in ---
  static async preCheckIn(req, res) {
    try {
      const { id } = req.params;
      const { idType, idNumber, estimatedArrivalTime, specialRequests } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      if (idType) resv.idType = idType;
      if (idNumber) resv.idNumber = idNumber;
      if (estimatedArrivalTime) resv.estimatedArrivalTime = estimatedArrivalTime;
      if (specialRequests) resv.specialRequests = specialRequests;
      resv.isPreCheckedIn = true;

      await resv.save();

      return res.status(200).json({
        success: true,
        message: "Digital pre-check-in completed successfully! Your key will be ready at the front desk.",
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Web Check-In: Generate Shareable Link (Video 1) ---
  static async generateWebCheckInLink(req, res) {
    try {
      const { id } = req.params;
      const { expiryHours = 24 } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + Number(expiryHours) * 3600 * 1000);

      resv.webCheckInToken = token;
      resv.webCheckInExpiresAt = expiresAt;
      resv.webCheckInStatus = "pending";
      await resv.save();

      const origin = req.headers.origin || "http://localhost:3000";
      const checkInUrl = `${origin}/customer/web-checkin/${token}`;

      // WhatsApp formatted message
      const whatsappText = `Namaste ${resv.guestName}! Greetings from ${resv.hotelName || "our Hotel"}. To save your time at the front desk, please complete your online web check-in & upload your ID proof before arrival: ${checkInUrl} (Valid for ${expiryHours} hours). Have a pleasant stay!`;
      const whatsappUrl = `https://wa.me/${(resv.guestPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappText)}`;

      return res.status(200).json({
        success: true,
        message: "Web check-in link generated successfully",
        data: {
          token,
          checkInUrl,
          whatsappUrl,
          expiresAt,
          guestName: resv.guestName,
          guestPhone: resv.guestPhone,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Web Check-In: Public Guest Details by Token ---
  static async getWebCheckInDetails(req, res) {
    try {
      const { token } = req.params;
      const resv = await Reservation.findOne({ webCheckInToken: token });

      if (!resv) {
        return res.status(404).json({ success: false, message: "Invalid or expired web check-in link." });
      }

      if (resv.webCheckInExpiresAt && new Date() > new Date(resv.webCheckInExpiresAt)) {
        return res.status(400).json({ success: false, message: "This web check-in link has expired. Please contact the front desk." });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: resv.id,
          hotelName: resv.hotelName || "Grand Horizon Hotel & Resort",
          guestName: resv.guestName,
          guestPhone: resv.guestPhone,
          guestEmail: resv.guestEmail,
          roomType: resv.roomType,
          roomNumber: resv.roomNumber,
          checkIn: resv.checkIn,
          checkOut: resv.checkOut,
          adults: resv.adults || 1,
          children: resv.children || 0,
          totalAmount: resv.totalAmount || 0,
          paidAmount: resv.paidAmount || 0,
          balanceAmount: Math.max(0, (resv.totalAmount || 0) - (resv.paidAmount || 0)),
          isPreCheckedIn: resv.isPreCheckedIn,
          webCheckInStatus: resv.webCheckInStatus,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- AI OCR ID Verification (Video 1) ---
  static async verifyIdDocument(req, res) {
    try {
      const { imageData, fileName, preferredType } = req.body;
      const result = await OCRService.extractIdDetails({ imageData, fileName, preferredType });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Web Check-In: Guest Submission ---
  static async submitWebCheckIn(req, res) {
    try {
      const { token } = req.params;
      const {
        idType,
        idNumber,
        idDocUrl,
        signatureUrl,
        coGuests = [],
        paymentPreference = "pay_at_hotel",
        estimatedArrivalTime,
        specialRequests,
        autoCheckIn = false,
      } = req.body;

      const resv = await Reservation.findOne({ webCheckInToken: token });
      if (!resv) {
        return res.status(404).json({ success: false, message: "Invalid check-in link" });
      }

      if (idType) resv.idType = idType;
      if (idNumber) resv.idNumber = idNumber;
      if (idDocUrl) resv.idDocUrl = idDocUrl;
      if (signatureUrl) resv.signatureUrl = signatureUrl;
      if (coGuests && Array.isArray(coGuests)) resv.coGuests = coGuests;
      if (paymentPreference) resv.paymentPreference = paymentPreference;
      if (estimatedArrivalTime) resv.estimatedArrivalTime = estimatedArrivalTime;
      if (specialRequests) resv.specialRequests = specialRequests;

      resv.isPreCheckedIn = true;
      resv.webCheckInStatus = "submitted";

      // If hotel front desk enabled auto-check-in upon web submission
      if (autoCheckIn && resv.roomNumber && resv.roomNumber !== "TBD") {
        resv.status = "checked_in";
        const cleanRoomNum = String(resv.roomNumber || "").replace(/room\s*/i, "").trim();
        const roomMatch = {
          number: { $in: [cleanRoomNum, `Room ${cleanRoomNum}`, resv.roomNumber] },
          ...(resv.hotelId ? { hotelId: resv.hotelId } : resv.orgId ? { orgId: resv.orgId } : {}),
        };
        await Room.updateMany(roomMatch, { status: "occupied", guest: resv.guestName });
      }

      await resv.save();

      try {
        await AuditLog.create({
          userId: resv.id,
          user: `${resv.guestName} (Guest Self Service)`,
          action: "WEB_CHECK_IN_SUBMIT",
          resource: `Reservation #${resv.id}`,
          oldValue: "Pending web check-in",
          newValue: `Submitted with ${idType} (${idNumber || "verified"})`,
        });
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: "Web check-in completed successfully! Your digital check-in pass is ready.",
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Guest Portal: Pre-Check-In by Booking ID ---
  static async preCheckIn(req, res) {
    try {
      const { id } = req.params;
      const { idType, idNumber, idDocUrl, estimatedArrivalTime, specialRequests } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) {
        return res.status(404).json({ success: false, message: "Reservation not found" });
      }

      if (idType) resv.idType = idType;
      if (idNumber) resv.idNumber = idNumber;
      if (idDocUrl) resv.idDocUrl = idDocUrl;
      if (estimatedArrivalTime) resv.estimatedArrivalTime = estimatedArrivalTime;
      if (specialRequests) resv.specialRequests = specialRequests;

      resv.isPreCheckedIn = true;
      resv.webCheckInStatus = "submitted";
      await resv.save();

      try {
        await AuditLog.create({
          userId: resv.id,
          user: `${resv.guestName} (Guest Portal)`,
          action: "PRE_CHECK_IN_SUBMIT",
          resource: `Reservation #${resv.id}`,
          oldValue: "Pending Pre-check-in",
          newValue: `Pre-checked in with ${idType} (${idNumber || "verified"})`,
        });
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: "Pre-check-in completed successfully! Express key pickup is ready.",
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Front Desk: Room Change & Upgrade with Tariff Difference (Video 2) ---
  static async changeRoom(req, res) {
    try {
      const { id } = req.params;
      const {
        newRoomNumber,
        newRoomType,
        reason = "Guest Request",
        isPaidUpgrade = false,
        upgradePriceDifference = 0,
      } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      const oldRoomNumber = resv.roomNumber;

      // Check if new room exists and is available
      const cleanNewNum = String(newRoomNumber || "").replace(/room\s*/i, "").trim();
      const newRoomFilter = {
        number: { $in: [cleanNewNum, `Room ${cleanNewNum}`, newRoomNumber] },
        ...(resv.hotelId ? { hotelId: resv.hotelId } : resv.orgId ? { orgId: resv.orgId } : {}),
      };
      const targetRoom = await Room.findOne(newRoomFilter);
      if (!targetRoom) {
        return res.status(400).json({ success: false, message: `Room ${newRoomNumber} does not exist.` });
      }

      if (targetRoom.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `Room ${newRoomNumber} is currently ${targetRoom.status}. Only available rooms can be assigned.`,
        });
      }

      // Check housekeeping status: discourage dirty rooms
      if (targetRoom.housekeepingStatus === "dirty") {
        return res.status(400).json({
          success: false,
          message: `Room ${newRoomNumber} is marked as Dirty. Please ask Housekeeping to clean and inspect it before moving guest.`,
        });
      }

      // Update reservation details
      resv.roomNumber = newRoomNumber;
      if (newRoomType) resv.roomType = newRoomType;

      // Handle Upgrade billing
      if (isPaidUpgrade && Number(upgradePriceDifference) > 0) {
        const diffAmount = Number(upgradePriceDifference);
        if (!resv.folioCharges) resv.folioCharges = [];
        resv.folioCharges.push({
          description: `Room Upgrade Charge: Room ${oldRoomNumber} to ${newRoomNumber} (${newRoomType || "Higher Category"})`,
          department: "Room",
          amount: diffAmount,
          tax: Math.round(diffAmount * 0.12),
          date: new Date(),
        });
        resv.totalAmount = (resv.totalAmount || 0) + diffAmount + Math.round(diffAmount * 0.12);
      }

      if (!resv.roomChanges) resv.roomChanges = [];
      resv.roomChanges.push({
        fromRoom: oldRoomNumber,
        toRoom: newRoomNumber,
        reason: isPaidUpgrade ? `${reason} (Paid Upgrade +₹${upgradePriceDifference})` : `${reason} (Complimentary)`,
        date: new Date(),
        changedBy: req.user?.name || "Front Desk",
      });
      await resv.save();

      // Mark old room as dirty for cleaning
      if (oldRoomNumber && oldRoomNumber !== "TBD") {
        const cleanOldNum = String(oldRoomNumber || "").replace(/room\s*/i, "").trim();
        const oldRoomFilter = {
          number: { $in: [cleanOldNum, `Room ${cleanOldNum}`, oldRoomNumber] },
          ...(resv.hotelId ? { hotelId: resv.hotelId } : resv.orgId ? { orgId: resv.orgId } : {}),
        };
        await Room.updateMany(oldRoomFilter, { status: "dirty", guest: null, housekeepingStatus: "dirty", cleaner: "Turnover Required" });
      }

      // Lock new room -> occupied
      targetRoom.status = "occupied";
      targetRoom.guest = resv.guestName;
      await targetRoom.save();

      // Audit Log
      await AuditLog.create({
        user: req.user?.name || "Front Desk Receptionist",
        action: "ROOM_CHANGE",
        resource: `Reservation #${resv.id}`,
        oldValue: `Room ${oldRoomNumber}`,
        newValue: `Room ${newRoomNumber} (${isPaidUpgrade ? "Paid Upgrade" : "Complimentary"})`,
      });

      return res.json({
        success: true,
        message: `Guest ${resv.guestName} shifted to Room ${newRoomNumber} (${isPaidUpgrade ? `Paid +₹${upgradePriceDifference}` : "Complimentary"}). Old room ${oldRoomNumber} sent to Housekeeping.`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Stay Extension with Automatic Recalculation (Video 2) ---
  static async extendStay(req, res) {
    try {
      const { id } = req.params;
      const { newCheckOutDate, ratePerNight, additionalAmount } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      const oldCheckOutDate = resv.checkOut;
      let calculatedCharge = 0;

      if (additionalAmount !== undefined && Number(additionalAmount) >= 0) {
        calculatedCharge = Number(additionalAmount);
      } else if (ratePerNight && newCheckOutDate) {
        const d1 = new Date(oldCheckOutDate).getTime();
        const d2 = new Date(newCheckOutDate).getTime();
        const extraNights = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)));
        calculatedCharge = extraNights * Number(ratePerNight);
      }

      resv.checkOut = newCheckOutDate;
      if (calculatedCharge > 0) {
        if (!resv.folioCharges) resv.folioCharges = [];
        const tax = Math.round(calculatedCharge * 0.12);
        resv.folioCharges.push({
          description: `Stay Extension: ${oldCheckOutDate} to ${newCheckOutDate}`,
          department: "Room",
          amount: calculatedCharge,
          tax,
          date: new Date(),
        });
        resv.totalAmount = (resv.totalAmount || 0) + calculatedCharge + tax;
      }

      await resv.save();

      try {
        await AuditLog.create({
          userId: req.user?.id || req.user?.userId || "system",
          user: req.user?.name || "Front Desk Receptionist",
          userRole: req.user?.role || "receptionist",
          orgId: resv.orgId || req.tenant?.orgId || "",
          hotelId: resv.hotelId || req.tenant?.hotelId || "",
          action: "EXTEND_STAY",
          resource: `Reservation #${resv.id}`,
          oldValue: `Check-out: ${oldCheckOutDate}`,
          newValue: `Check-out: ${newCheckOutDate} (+₹${calculatedCharge})`,
        });
      } catch (auditErr) {
        console.warn("Audit logging non-fatal error:", auditErr.message);
      }

      return res.json({
        success: true,
        message: `Stay extended to ${newCheckOutDate}. Added ₹${calculatedCharge} to folio.`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Cancellation with Refund Policy ---
  static async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason, refundPercentage = 100 } = req.body;

      const resv = await Reservation.findOne({ id });
      if (!resv) return res.status(404).json({ success: false, message: "Reservation not found" });

      const refundAmount = Math.round(((resv.paidAmount || 0) * Number(refundPercentage)) / 100);

      resv.status = "cancelled";
      resv.cancellationReason = reason || "Guest requested cancellation";
      resv.refundAmount = refundAmount;
      await resv.save();

      // Free room if assigned
      if (resv.roomNumber && resv.roomNumber !== "TBD") {
        await Room.findOneAndUpdate({ number: resv.roomNumber }, { status: "available", guest: null });
      }

      return res.json({
        success: true,
        message: `Reservation ${resv.id} cancelled. Refund calculated: ₹${refundAmount} (${refundPercentage}%)`,
        data: resv,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res, next) {
    try {
      const reservation = await ReservationsService.deleteReservation({
        id: req.params.id,
      });
      return res.status(200).json({
        success: true,
        message: "Reservation deleted successfully",
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReservationsController;
