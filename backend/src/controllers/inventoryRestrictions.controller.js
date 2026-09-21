const InventoryRestriction = require("../models/InventoryRestriction");

exports.getRestrictions = async (req, res, next) => {
  try {
    const { startDate, endDate, roomType } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (roomType && roomType !== "ALL") {
      query.roomType = roomType;
    }
    const restrictions = await InventoryRestriction.find(query).sort({ date: 1 });
    return res.status(200).json({ success: true, count: restrictions.length, data: restrictions });
  } catch (error) {
    next(error);
  }
};

exports.setRestriction = async (req, res, next) => {
  try {
    const { date, roomType = "ALL", stopSell, minStay = 1, rateAdjustment = 0, reason } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required (YYYY-MM-DD)" });
    }

    const restriction = await InventoryRestriction.findOneAndUpdate(
      { date, roomType },
      {
        stopSell: stopSell !== undefined ? stopSell : false,
        minStay: Number(minStay) || 1,
        rateAdjustment: Number(rateAdjustment) || 0,
        reason: reason || "Manual restriction",
        updatedBy: req.user?.name || "Staff",
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Restrictions updated for ${date} (${roomType})`,
      data: restriction,
    });
  } catch (error) {
    next(error);
  }
};
