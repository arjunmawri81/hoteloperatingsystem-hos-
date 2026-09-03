const Area = require("../models/Area");

exports.getAllAreas = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { manager: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } },
      ];
    }
    const areas = await Area.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: areas.length, data: areas });
  } catch (error) {
    next(error);
  }
};

exports.createArea = async (req, res, next) => {
  try {
    const { name, region, manager, hotelsCount, totalRooms, occupancy, revenue } = req.body;
    const id = `area-${Date.now()}`;
    const newArea = await Area.create({
      id,
      name,
      region: region || "General Region",
      manager,
      hotelsCount: Number(hotelsCount) || 1,
      totalRooms: Number(totalRooms) || 0,
      occupancy: occupancy || "0%",
      revenue: revenue || "$0",
      status: "active",
    });
    res.status(201).json({ success: true, data: newArea });
  } catch (error) {
    next(error);
  }
};
