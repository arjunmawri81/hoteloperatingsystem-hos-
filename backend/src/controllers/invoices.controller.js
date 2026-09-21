const Invoice = require("../models/Invoice");
const Room = require("../models/Room");
const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");

// 1. Get all Invoices & calculate revenue metrics directly from MongoDB
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, search, orgId, hotelId, billedBy } = req.query;
    const filter = {};

    const userRole = req.user?.role || req.tenant?.role;
    let targetOrgId = req.user?.orgId || req.tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = orgId || req.tenant?.orgId || null;
    } else if (!targetOrgId && orgId && orgId !== "all" && orgId !== "org-1") {
      targetOrgId = orgId;
    }

    const targetHotelId = hotelId || (userRole !== "area_manager" && (req.tenant?.hotelId || req.user?.hotelId));
    const targetHotelName = req.tenant?.hotelName || req.user?.hotelName;

    if (userRole === "super_admin" && !targetHotelId && !targetOrgId) {
      // super_admin sees all
    } else if (targetHotelId) {
      filter.hotelId = targetHotelId;
    } else if (targetHotelName && targetHotelName !== "All" && targetHotelName !== "Main Property") {
      filter.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;
      if (userRole === "area_manager") {
        const assignedNames = req.user?.assignedHotelNames || [];
        if (assignedNames.length > 0) {
          filter.hotelName = { $in: assignedNames };
        }
      }
    } else if (userRole && userRole !== "super_admin") {
      return res.status(200).json({
        success: true,
        count: 0,
        metrics: { totalInvoiced: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 },
        data: [],
      });
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (billedBy && billedBy !== "all") {
      filter.billedBy = billedBy;
    }

    if (search) {
      filter.$or = [
        { guest: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
        { room: { $regex: search, $options: "i" } },
        { billedBy: { $regex: search, $options: "i" } },
        { hotelName: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPending = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + (i.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: invoices.length,
      metrics: {
        totalInvoiced,
        totalPaid,
        totalPending,
        totalOverdue,
      },
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create and persist new Invoice & transaction record to MongoDB
exports.createInvoice = async (req, res, next) => {
  try {
    const { guest, guestName, room, roomNumber, amount, total, status, date, hotelId, hotelName, paymentMethod, orgId, billedBy, billedByRole } = req.body;

    const resolvedRoom = String(room || roomNumber || "").trim();
    const resolvedGuest = String(guest || guestName || "").trim();
    const resolvedAmount = Number(amount || total || 0);

    if (!resolvedRoom) {
      return res.status(400).json({
        success: false,
        message: "Room number is required.",
      });
    }

    // Validate that room exists for this hotel if hotelId provided
    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId;
    if (targetHotelId) {
      const hotelRoomsCount = await Room.countDocuments({ hotelId: targetHotelId });
      if (hotelRoomsCount > 0) {
        const roomExists = await Room.findOne({
          hotelId: targetHotelId,
          number: resolvedRoom,
        });

        if (!roomExists) {
          return res.status(400).json({
            success: false,
            message: `Room "${resolvedRoom}" does not exist in property "${hotelName || "this hotel"}". Please select an available room from the property inventory.`,
          });
        }
      }
    }

    const id = `INV-${Math.floor(8820 + Math.random() * 500)}`;
    const formattedDate = date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const newInvoice = await Invoice.create({
      id,
      guest: resolvedGuest || "Guest",
      room: resolvedRoom,
      amount: resolvedAmount,
      status: status || "pending",
      date: formattedDate,
      hotelId: targetHotelId || "",
      hotelName: hotelName || req.user?.hotelName || "Main Property",
      paymentMethod: paymentMethod || (status === "paid" ? "Credit Card" : "Pending"),
      paidAt: status === "paid" ? new Date() : null,
      transactionRef: status === "paid" ? `TXN-${Date.now()}` : null,
      orgId: orgId || req.tenant?.orgId || req.user?.orgId || "",
      billedBy: billedBy || req.user?.name || "Front Desk Staff",
      billedByRole: billedByRole || req.user?.role || "receptionist",
    });

    res.status(201).json({
      success: true,
      message: "Invoice and transaction record saved to database.",
      data: newInvoice,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mark Invoice as Paid & record payment settlement in MongoDB
exports.markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const transactionRef = `TXN-SETTLE-${Date.now()}`;
    const paidAt = new Date();

    const updated = await Invoice.findOneAndUpdate(
      { id },
      {
        status: "paid",
        paymentMethod: paymentMethod || "Credit Card",
        transactionRef,
        paidAt,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Invoice ${id} not found in database.`,
      });
    }

    // Auto-record in active Cashier Shift if Cash / UPI payment
    try {
      let activeShift = await CashShift.findOne({
        status: "open",
        ...(updated.hotelId && updated.hotelId !== "hotel-101" ? { hotelId: updated.hotelId } : {}),
      }).sort({ createdAt: -1 });

      if (!activeShift) {
        activeShift = await CashShift.findOne({ status: "open" }).sort({ createdAt: -1 });
      }

      if (activeShift) {
        const txId = `CTX-${Date.now().toString().slice(-6)}`;
        await CashTransaction.create({
          transactionId: txId,
          shiftId: activeShift.shiftId,
          hotelId: activeShift.hotelId,
          hotelName: activeShift.hotelName || "Main Property",
          orgId: activeShift.orgId || "org-1",
          type: "cash_in",
          category: "room_payment",
          amount: updated.amount || 0,
          description: `Settled Invoice ${updated.id} (${updated.guest} - Room ${updated.room}) via ${paymentMethod || "Cash"}`,
          referenceId: updated.id,
          recordedBy: req.user?.name || "Front Desk Cashier",
        });

        activeShift.totalCashIn = (activeShift.totalCashIn || 0) + (updated.amount || 0);
        activeShift.expectedCash = (activeShift.openingFloat || 0) + activeShift.totalCashIn - (activeShift.totalCashOut || 0);
        await activeShift.save();
      }
    } catch (txErr) {
      console.error("CashTransaction auto-link error:", txErr);
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${id} marked as Paid. Transaction ${transactionRef} saved.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
