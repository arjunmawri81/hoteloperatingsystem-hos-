const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const HousekeepingTask = require("../models/HousekeepingTask");
const AuditService = require("./audit.service");
const NotificationService = require("./notification.service");

class ReservationsService {
  /**
   * Check room availability for given dates & room type
   */
  static async checkAvailability({ hotelName, hotelId, roomNumber, checkIn, checkOut }) {
    if (!roomNumber || roomNumber === "TBD") return true;

    const query = {
      roomNumber,
      status: { $in: ["confirmed", "checked_in"] },
      $or: [
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn },
        },
      ],
    };

    if (hotelId) {
      query.hotelId = hotelId;
    } else if (hotelName) {
      query.hotelName = new RegExp(hotelName, "i");
    }

    const overlap = await Reservation.findOne(query);
    return !overlap;
  }

  /**
   * Get all reservations with tenant filtering
   */
  static async listReservations({ tenant, filters = {}, user }) {
    const query = {};

    const userRole = user?.role || tenant?.role;
    let targetOrgId = user?.orgId || tenant?.orgId;

    // 1. Customer / Guest role scoping
    if (userRole === "customer" || userRole === "guest") {
      const email = filters.guestEmail || user?.email;
      if (email) {
        query.guestEmail = new RegExp(`^${email.trim()}$`, "i");
      }
      if (filters.status && filters.status !== "all") {
        query.status = filters.status;
      }
      if (filters.id) {
        query.id = filters.id;
      }
      return await Reservation.find(query).sort({ createdAt: -1 });
    }

    // 2. Staff / Admin scoping
    if (userRole === "super_admin") {
      targetOrgId = filters.orgId || tenant?.orgId || null;
    } else if (!targetOrgId && filters.orgId && filters.orgId !== "all" && filters.orgId !== "org-1") {
      targetOrgId = filters.orgId;
    }

    const targetHotelId = filters.hotelId || tenant?.hotelId || user?.hotelId;
    const targetHotelName = filters.hotelName || tenant?.hotelName || user?.hotelName;

    // Multi-tenant hotel scoping
    if (targetHotelId) {
      query.hotelId = targetHotelId;
    } else if (targetHotelName && targetHotelName !== "All" && targetHotelName !== "Main Property") {
      query.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
    } else if (targetOrgId && targetOrgId !== "all") {
      const Hotel = require("../models/Hotel");
      const hotels = await Hotel.find({ orgId: targetOrgId }).select("id name");
      const hotelIds = hotels.map((h) => h.id);
      const hotelNames = hotels.map((h) => h.name);

      query.$or = [
        { orgId: targetOrgId },
        { hotelId: { $in: hotelIds } },
        { hotelName: { $in: hotelNames } },
      ];
    } else if (filters.guestEmail) {
      query.guestEmail = new RegExp(`^${filters.guestEmail.trim()}$`, "i");
    } else if (userRole && userRole !== "super_admin") {
      return [];
    }

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }
    if (filters.guestEmail) {
      query.guestEmail = new RegExp(`^${filters.guestEmail.trim()}$`, "i");
    }
    if (filters.id) {
      query.id = filters.id;
    }

    return await Reservation.find(query).sort({ createdAt: -1 });
  }

  /**
   * Create a new reservation with full business rules execution
   */
  static async createReservation({ data, user, tenant, ipAddress }) {
    const {
      guestName,
      guestEmail,
      guestPhone,
      hotelName,
      hotelId,
      orgId,
      roomNumber = "TBD",
      roomType = "Deluxe King",
      checkIn,
      checkOut,
      totalAmount,
      paidAmount,
      source = "Web Direct",
    } = data;

    const resolvedOrgId = orgId || tenant?.orgId || user?.orgId || "";
    let resolvedHotelName = hotelName || tenant?.hotelName || user?.hotelName || "Main Property";
    let resolvedHotelId = hotelId || tenant?.hotelId || user?.hotelId || "";

    const Hotel = require("../models/Hotel");
    let effectiveOrgId = resolvedOrgId;
    if (resolvedHotelId) {
      const matchedHotel = await Hotel.findOne({ id: resolvedHotelId });
      if (matchedHotel) {
        resolvedHotelName = matchedHotel.name;
        if (!effectiveOrgId) effectiveOrgId = matchedHotel.orgId;
      }
    } else if (resolvedHotelName) {
      const matchedHotel = await Hotel.findOne({
        name: new RegExp(`^${resolvedHotelName.trim()}$`, "i"),
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
      });
      if (matchedHotel) {
        resolvedHotelId = matchedHotel.id;
        resolvedHotelName = matchedHotel.name;
        if (!effectiveOrgId) effectiveOrgId = matchedHotel.orgId;
      }
    }

    // 1. Business Rule: Check Room Availability & Auto-Allocate Available Room
    let allocatedRoomNumber = roomNumber;
    let isAvailable = await this.checkAvailability({
      hotelName: resolvedHotelName,
      hotelId: resolvedHotelId,
      roomNumber: allocatedRoomNumber,
      checkIn,
      checkOut,
    });

    // If requested room is unavailable or TBD, automatically find an available room in this hotel!
    if (!isAvailable || !allocatedRoomNumber || allocatedRoomNumber === "TBD") {
      const hotelRooms = await Room.find({
        ...(resolvedHotelId ? { hotelId: resolvedHotelId } : {}),
      });

      for (const r of hotelRooms) {
        const avail = await this.checkAvailability({
          hotelName: resolvedHotelName,
          hotelId: resolvedHotelId,
          roomNumber: r.number,
          checkIn,
          checkOut,
        });
        if (avail) {
          allocatedRoomNumber = r.number;
          isAvailable = true;
          break;
        }
      }
    }

    if (!isAvailable) {
      const error = new Error(`All rooms in ${resolvedHotelName} are fully booked for the selected dates.`);
      error.status = 409;
      throw error;
    }

    // 2. Business Rule: Calculate Amount if not specified
    const calculatedTotal = Number(totalAmount) || 15000;
    const calculatedPaid = Number(paidAmount) || 0;

    // 3. Persist Reservation in Repository
    const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation = new Reservation({
      id: reservationId,
      orgId: effectiveOrgId || "org-taj-luxury",
      hotelId: resolvedHotelId || "hot-1",
      hotelName: resolvedHotelName,
      guestName,
      guestEmail: guestEmail ? guestEmail.toLowerCase() : "guest@example.com",
      guestPhone: guestPhone || "+91 90000 00000",
      idType: data.idType || "Aadhaar",
      idNumber: data.idNumber || "",
      idDocUrl: data.idDocUrl || "",
      adults: Number(data.adults) || 1,
      children: Number(data.children) || 0,
      paymentPreference: data.paymentPreference || data.paymentMode || "pay_at_counter",
      roomNumber: allocatedRoomNumber || "101",
      roomType,
      checkIn,
      checkOut,
      status: data.status || "confirmed",
      totalAmount: calculatedTotal,
      paidAmount: calculatedPaid,
      source,
    });

    if (calculatedPaid > 0) {
      newReservation.payments.push({
        amount: calculatedPaid,
        method: data.paymentMethod || data.paymentMode || "Cash",
        date: new Date(),
        status: "captured",
        note: "Booking Advance / Deposit",
      });
    }

    await newReservation.save();

    // 4. Automatically Sync Room Status in MongoDB
    const cleanRoomNum = String(roomNumber || "").replace(/room\s*/i, "").trim();
    if (cleanRoomNum && cleanRoomNum !== "TBD") {
      const roomMatch = {
        number: cleanRoomNum,
        ...(resolvedHotelId ? { hotelId: resolvedHotelId } : resolvedOrgId ? { orgId: resolvedOrgId } : {}),
      };
      if (newReservation.status === "checked_in") {
        await Room.findOneAndUpdate(
          roomMatch,
          { status: "occupied", guest: guestName }
        );
      } else if (newReservation.status === "confirmed") {
        await Room.findOneAndUpdate(
          roomMatch,
          { guest: guestName }
        );
      }
    }

    // 5. Create Audit Log
    await AuditService.log({
      userId: user?.id || "guest",
      userRole: user?.role || "customer",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "CREATE_RESERVATION",
      resource: "reservations",
      resourceId: reservationId,
      details: {
        guestName,
        hotelName,
        roomNumber,
        checkIn,
        checkOut,
        totalAmount: calculatedTotal,
      },
      ipAddress,
    });

    // 6. Send Notification
    await NotificationService.send({
      recipient: guestEmail || "guest@example.com",
      type: "BOOKING_CONFIRMATION",
      payload: {
        reservationId,
        guestName,
        hotelName,
        checkIn,
        checkOut,
      },
    });

    return newReservation;
  }

  /**
   * Update reservation status with audit trail and live Room status sync
   */
  static async updateStatus({ id, status, user, tenant, ipAddress }) {
    const reservation = await Reservation.findOne({ id });
    if (!reservation) {
      const error = new Error("Reservation not found");
      error.status = 404;
      throw error;
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Automatically Sync Room Status in MongoDB
    const cleanRoomNum = String(reservation.roomNumber || "").replace(/room\s*/i, "").trim();
    if (cleanRoomNum && cleanRoomNum !== "TBD") {
      const roomMatch = {
        number: { $in: [cleanRoomNum, `Room ${cleanRoomNum}`, reservation.roomNumber] },
        ...(reservation.hotelId ? { hotelId: reservation.hotelId } : reservation.orgId ? { orgId: reservation.orgId } : {}),
      };

      if (status === "checked_in") {
        await Room.updateMany(
          roomMatch,
          { status: "occupied", guest: reservation.guestName }
        );
      } else if (status === "checked_out") {
        await Room.updateMany(
          roomMatch,
          { status: "dirty", guest: null, housekeepingStatus: "dirty", cleaner: "Turnover Required" }
        );
        // Automatically create or update housekeeping turnover task
        const existingTask = await HousekeepingTask.findOne({
          roomNumber: cleanRoomNum,
          ...(reservation.hotelId ? { hotelId: reservation.hotelId } : {}),
        });
        if (existingTask) {
          existingTask.status = "dirty";
          existingTask.priority = "high";
          existingTask.assignedTo = "Unassigned";
          existingTask.lastCleaned = "Turnover Required (Guest Checked Out)";
          await existingTask.save();
        } else {
          await HousekeepingTask.create({
            id: `task-${Date.now()}`,
            roomNumber: cleanRoomNum,
            roomType: reservation.roomType || "Standard Room",
            floor: Number(cleanRoomNum[0]) || 1,
            status: "dirty",
            priority: "high",
            assignedTo: "Unassigned",
            lastCleaned: "Turnover Required (Guest Checked Out)",
            dueTime: "Today 02:00 PM",
            hotelId: reservation.hotelId,
            hotelName: reservation.hotelName,
            orgId: reservation.orgId,
          });
        }
      } else if (status === "cancelled") {
        await Room.updateMany(
          roomMatch,
          { status: "available", guest: null }
        );
      }
    }

    // Audit Log
    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "hotel_manager",
      orgId: reservation.orgId || tenant?.orgId || "org-1",
      hotelId: reservation.hotelId || tenant?.hotelId || "",
      action: "UPDATE_RESERVATION_STATUS",
      resource: "reservations",
      resourceId: id,
      details: { previousStatus, newStatus: status },
      ipAddress,
    });

    return reservation;
  }

  /**
   * Delete a reservation by ID
   */
  static async deleteReservation({ id }) {
    const reservation = await Reservation.findOneAndDelete({ id });
    if (!reservation) {
      const error = new Error("Reservation not found");
      error.status = 404;
      throw error;
    }
    return reservation;
  }
}

module.exports = ReservationsService;
