const Invoice = require("../models/Invoice");
const Room = require("../models/Room");

// 1. Get all Invoices & calculate revenue metrics directly from MongoDB
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, search, orgId, hotelId, billedBy } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (orgId) {
      filter.orgId = orgId;
    }

    if (hotelId && hotelId !== "all") {
      filter.hotelId = hotelId;
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

    let invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    // Fallback if orgId strictly filtered out legacy items
    if (invoices.length === 0 && orgId) {
      const allMatching = await Invoice.find({}).sort({ createdAt: -1 });
      if (allMatching.length > 0) {
        invoices = allMatching;
      }
    }

    const allInvoices = await Invoice.find({});
    const totalInvoiced = allInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPaid = allInvoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPending = allInvoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalOverdue = allInvoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + (i.amount || 0), 0);

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
    const { guest, room, amount, status, date, hotelId, hotelName, paymentMethod, orgId, billedBy, billedByRole } = req.body;

    if (!room) {
      return res.status(400).json({
        success: false,
        message: "Room number is required.",
      });
    }

    // Validate that room exists for this hotel
    const targetHotelId = hotelId || "hotel-1788547097892";
    const hotelRoomsCount = await Room.countDocuments({ hotelId: targetHotelId });
    if (hotelRoomsCount > 0) {
      const roomExists = await Room.findOne({
        hotelId: targetHotelId,
        $or: [
          { number: String(room) },
          { roomNumber: String(room) },
        ],
      });

      if (!roomExists) {
        return res.status(400).json({
          success: false,
          message: `Room "${room}" does not exist in property "${hotelName || "this hotel"}". Please select an available room from the property inventory.`,
        });
      }
    }

    const id = `INV-${Math.floor(8820 + Math.random() * 500)}`;
    const formattedDate = date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const newInvoice = await Invoice.create({
      id,
      guest,
      room,
      amount: Number(amount),
      status: status || "pending",
      date: formattedDate,
      hotelId: hotelId || "hotel-1788547097892",
      hotelName: hotelName || "Regal 77",
      paymentMethod: paymentMethod || (status === "paid" ? "Credit Card" : "Pending"),
      paidAt: status === "paid" ? new Date() : null,
      transactionRef: status === "paid" ? `TXN-${Date.now()}` : null,
      orgId: orgId || req.tenant?.orgId || req.user?.orgId || "org-1",
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

    res.status(200).json({
      success: true,
      message: `Invoice ${id} marked as Paid. Transaction ${transactionRef} saved.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
