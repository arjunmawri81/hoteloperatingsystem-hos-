const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");
const AuditLog = require("../models/AuditLog");

class CashCounterController {
  /**
   * GET /api/cash-counter/current
   * Retrieves the currently open shift or latest status
   */
  static async getCurrentShift(req, res) {
    try {
      const targetHotelId = req.query.hotelId || req.tenant?.hotelId || req.user?.hotelId || req.headers["x-hotel-id"];
      const targetOrgId = req.query.orgId || req.tenant?.orgId || req.user?.orgId || req.headers["x-org-id"];
      const targetHotelName = req.query.hotelName || req.tenant?.hotelName || req.user?.hotelName || req.headers["x-hotel-name"];

      const filter = { status: "open" };
      if (targetHotelId) {
        filter.hotelId = targetHotelId;
      } else if (targetHotelName && targetHotelName !== "All" && targetHotelName !== "Main Property") {
        filter.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
      } else if (targetOrgId && targetOrgId !== "all") {
        filter.orgId = targetOrgId;
      }

      const activeShift = await CashShift.findOne(filter).sort({ createdAt: -1 });

      if (!activeShift) {
        // Return latest closed shift if any, for context
        const closedFilter = { ...filter, status: "closed" };
        const lastClosedShift = await CashShift.findOne(closedFilter).sort({ createdAt: -1 });
        return res.status(200).json({
          success: true,
          isOpen: false,
          activeShift: null,
          lastClosedShift,
        });
      }

      // Fetch live transactions for the active shift
      const transactions = await CashTransaction.find({ shiftId: activeShift.shiftId }).sort({ timestamp: -1 });

      // Recalculate totals
      let totalCashIn = 0;
      let totalCashOut = 0;

      transactions.forEach((tx) => {
        if (tx.type === "cash_in") totalCashIn += tx.amount;
        if (tx.type === "cash_out") totalCashOut += tx.amount;
      });

      const expectedCash = (activeShift.openingFloat || 0) + totalCashIn - totalCashOut;

      return res.status(200).json({
        success: true,
        isOpen: true,
        activeShift: {
          ...activeShift.toObject(),
          totalCashIn,
          totalCashOut,
          expectedCash,
        },
        transactions,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/cash-counter/open
   * Start a new shift with opening cash float
   */
  static async openShift(req, res) {
    try {
      const {
        hotelId,
        hotelName,
        orgId,
        cashierName = "Front Desk Staff",
        openingFloat = 0,
        notes = "",
      } = req.body;

      const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId || req.headers["x-hotel-id"] || "";
      const targetHotelName = hotelName || req.tenant?.hotelName || req.user?.hotelName || req.headers["x-hotel-name"] || "";
      const targetOrgId = orgId || req.tenant?.orgId || req.user?.orgId || req.headers["x-org-id"] || "";

      // Check if already an open shift for this specific hotel
      const existingFilter = { status: "open" };
      if (targetHotelId) {
        existingFilter.hotelId = targetHotelId;
      } else if (targetHotelName) {
        existingFilter.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
      }

      const existing = await CashShift.findOne(existingFilter);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A shift (${existing.shiftId}) is already open for ${existing.hotelName || targetHotelName || "this property"} by ${existing.cashierName}. Please close it first.`,
        });
      }

      const shiftId = `SHIFT-${Date.now().toString().slice(-6)}`;
      const parsedFloat = Number(openingFloat) || 0;

      const newShift = await CashShift.create({
        shiftId,
        hotelId: targetHotelId,
        hotelName: targetHotelName,
        orgId: targetOrgId,
        cashierName,
        status: "open",
        openingFloat: parsedFloat,
        expectedCash: parsedFloat,
        startTime: new Date(),
        handoverNotes: notes,
      });

      // Record initial transaction if opening float > 0
      if (parsedFloat > 0) {
        await CashTransaction.create({
          transactionId: `CTX-${Date.now().toString().slice(-6)}`,
          shiftId,
          hotelId: targetHotelId,
          hotelName: targetHotelName,
          orgId: targetOrgId,
          type: "cash_in",
          category: "opening_float",
          amount: parsedFloat,
          description: "Shift Opening Cash Float",
          recordedBy: cashierName,
        });
      }

      try {
        await AuditLog.create({
          userId: req.user?.id || req.user?.userId || "system",
          user: cashierName,
          hotelId: targetHotelId,
          orgId: targetOrgId,
          action: "OPEN_CASH_SHIFT",
          resource: `CashShift #${shiftId}`,
          oldValue: "No active shift",
          newValue: `Open with float ₹${parsedFloat} (${targetHotelName || targetHotelId})`,
        });
      } catch (e) {}

      return res.status(201).json({
        success: true,
        message: `Shift #${shiftId} opened successfully with float ₹${parsedFloat}.`,
        data: newShift,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/cash-counter/transaction
   * Record a Cash-In or Petty Cash payout
   */
  static async recordTransaction(req, res) {
    try {
      const { shiftId, type, category, amount, description, voucherNumber, referenceId, recordedBy } = req.body;

      if (!shiftId || !type || !amount || Number(amount) <= 0 || !description) {
        return res.status(400).json({ success: false, message: "Valid shiftId, type, positive amount, and description are required" });
      }

      const shift = await CashShift.findOne({ shiftId, status: "open" });
      if (!shift) {
        return res.status(404).json({ success: false, message: "Active open shift not found" });
      }

      const parsedAmount = Number(amount);
      const transactionId = `CTX-${Date.now().toString().slice(-6)}`;

      const tx = await CashTransaction.create({
        transactionId,
        shiftId,
        hotelId: shift.hotelId,
        hotelName: shift.hotelName || "",
        orgId: shift.orgId || "",
        type,
        category: category || (type === "cash_in" ? "room_payment" : "petty_cash_expense"),
        amount: parsedAmount,
        description,
        voucherNumber: voucherNumber || "",
        referenceId: referenceId || "",
        recordedBy: recordedBy || shift.cashierName,
      });

      // Update shift totals
      if (type === "cash_in") {
        shift.totalCashIn = (shift.totalCashIn || 0) + parsedAmount;
      } else {
        shift.totalCashOut = (shift.totalCashOut || 0) + parsedAmount;
      }
      shift.expectedCash = (shift.openingFloat || 0) + shift.totalCashIn - shift.totalCashOut;
      await shift.save();

      return res.status(201).json({
        success: true,
        message: `Cash transaction ₹${parsedAmount} recorded (${type.toUpperCase()})`,
        data: tx,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/cash-counter/close
   * Close current shift with physical denomination count and reconciliation
   */
  static async closeShift(req, res) {
    try {
      const {
        shiftId,
        denominations = {},
        actualCashCounted,
        discrepancyReason = "",
        handoverNotes = "",
        handoverTo = "",
      } = req.body;

      const shift = await CashShift.findOne({ shiftId, status: "open" });
      if (!shift) {
        return res.status(404).json({ success: false, message: "Active open shift not found" });
      }

      // Re-sum all transactions to get exact expected cash
      const transactions = await CashTransaction.find({ shiftId });
      let totalIn = 0;
      let totalOut = 0;
      transactions.forEach((tx) => {
        if (tx.type === "cash_in") totalIn += tx.amount;
        if (tx.type === "cash_out") totalOut += tx.amount;
      });

      const expectedCash = (shift.openingFloat || 0) + totalIn - totalOut;

      // Calculate counted from denominations if not directly provided
      const note500 = Number(denominations.note500) || 0;
      const note200 = Number(denominations.note200) || 0;
      const note100 = Number(denominations.note100) || 0;
      const note50 = Number(denominations.note50) || 0;
      const note20 = Number(denominations.note20) || 0;
      const note10 = Number(denominations.note10) || 0;
      const coins = Number(denominations.coins) || 0;

      const calcTotal =
        note500 * 500 +
        note200 * 200 +
        note100 * 100 +
        note50 * 50 +
        note20 * 20 +
        note10 * 10 +
        coins;

      const countedTotal = actualCashCounted !== undefined ? Number(actualCashCounted) : calcTotal;
      const discrepancy = countedTotal - expectedCash; // Negative = shortage, Positive = excess

      shift.status = "closed";
      shift.endTime = new Date();
      shift.totalCashIn = totalIn;
      shift.totalCashOut = totalOut;
      shift.expectedCash = expectedCash;
      shift.actualCashCounted = countedTotal;
      shift.discrepancy = discrepancy;
      shift.discrepancyReason = discrepancyReason;
      shift.denominations = {
        note500,
        note200,
        note100,
        note50,
        note20,
        note10,
        coins,
      };
      shift.handoverNotes = handoverNotes;
      shift.handoverTo = handoverTo;

      await shift.save();

      try {
        await AuditLog.create({
          userId: req.user?.id || req.user?.userId || "system",
          user: shift.cashierName,
          hotelId: shift.hotelId,
          orgId: shift.orgId,
          action: "CLOSE_CASH_SHIFT",
          resource: `CashShift #${shiftId}`,
          oldValue: `Expected ₹${expectedCash}`,
          newValue: `Counted ₹${countedTotal} (Diff: ₹${discrepancy})`,
        });
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: `Shift #${shiftId} closed successfully. Handover to ${handoverTo || "Next Shift"}.`,
        data: shift,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/cash-counter/history
   * View all past closed shifts
   */
  static async getShiftHistory(req, res) {
    try {
      const targetHotelId = req.query.hotelId || req.tenant?.hotelId || req.user?.hotelId || req.headers["x-hotel-id"];
      const targetOrgId = req.query.orgId || req.tenant?.orgId || req.user?.orgId || req.headers["x-org-id"];
      const targetHotelName = req.query.hotelName || req.tenant?.hotelName || req.user?.hotelName || req.headers["x-hotel-name"];

      const filter = { status: "closed" };
      if (targetHotelId) {
        filter.hotelId = targetHotelId;
      } else if (targetHotelName && targetHotelName !== "All" && targetHotelName !== "Main Property") {
        filter.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
      } else if (targetOrgId && targetOrgId !== "all") {
        filter.orgId = targetOrgId;
      }

      const shifts = await CashShift.find(filter).sort({ endTime: -1 }).limit(30);
      return res.status(200).json({ success: true, count: shifts.length, data: shifts });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = CashCounterController;
