const Guest = require("../models/Guest");

exports.getAllGuests = async (req, res, next) => {
  try {
    const { segment, search } = req.query;
    const filter = {};
    if (segment && segment !== "all") {
      filter.segment = segment;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { preferences: { $regex: search, $options: "i" } },
      ];
    }
    const guests = await Guest.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: guests.length, data: guests });
  } catch (error) {
    next(error);
  }
};

exports.createGuest = async (req, res, next) => {
  try {
    const { name, email, phone, stays, totalSpend, segment, preferences, notes } = req.body;
    const id = `gst-${Date.now().toString().slice(-4)}`;
    const newGuest = await Guest.create({
      id,
      name,
      email: email || "guest@example.com",
      phone,
      stays: Number(stays) || 1,
      totalSpend: Number(totalSpend) || 0,
      segment: segment || "New",
      preferences: preferences || "Standard preferences",
      notes: notes || "Registered at front desk",
    });
    res.status(201).json({ success: true, data: newGuest });
  } catch (error) {
    next(error);
  }
};
