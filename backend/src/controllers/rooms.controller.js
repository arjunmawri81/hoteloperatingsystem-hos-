const Room = require("../models/Room");

exports.getAllRooms = async (req, res, next) => {
  try {
    const { floor, status } = req.query;
    const filter = {};
    if (floor) filter.floor = Number(floor);
    if (status && status !== "all") filter.status = status;

    let rooms = await Room.find(filter).sort({ number: 1 });

    // Auto-seed default 24 rooms if empty
    if (rooms.length === 0 && !floor && (!status || status === "all")) {
      const defaultRooms = [
        { number: "101", floor: 1, type: "Standard Room", status: "available", rate: 140 },
        { number: "102", floor: 1, type: "Standard Room", status: "available", rate: 140 },
        { number: "103", floor: 1, type: "Deluxe King", status: "available", rate: 220 },
        { number: "104", floor: 1, type: "Standard Room", status: "available", rate: 140 },
        { number: "105", floor: 1, type: "Deluxe King", status: "available", rate: 220 },
        { number: "106", floor: 1, type: "Executive Suite", status: "available", rate: 380 },
        { number: "201", floor: 2, type: "Standard Room", status: "available", rate: 140 },
        { number: "202", floor: 2, type: "Standard Room", status: "available", rate: 140 },
        { number: "203", floor: 2, type: "Deluxe King", status: "available", rate: 220 },
        { number: "204", floor: 2, type: "Deluxe King", status: "available", rate: 220 },
        { number: "205", floor: 2, type: "Deluxe King", status: "available", rate: 220 },
        { number: "206", floor: 2, type: "Executive Suite", status: "available", rate: 380 },
        { number: "301", floor: 3, type: "Standard Room", status: "available", rate: 140 },
        { number: "302", floor: 3, type: "Deluxe King", status: "available", rate: 220 },
        { number: "303", floor: 3, type: "Deluxe King", status: "available", rate: 220 },
        { number: "304", floor: 3, type: "Executive Suite", status: "available", rate: 380 },
        { number: "305", floor: 3, type: "Deluxe King", status: "available", rate: 220 },
        { number: "306", floor: 3, type: "Standard Room", status: "available", rate: 140 },
        { number: "401", floor: 4, type: "Presidential Suite", status: "available", rate: 750 },
        { number: "402", floor: 4, type: "Executive Suite", status: "available", rate: 380 },
        { number: "403", floor: 4, type: "Deluxe King", status: "available", rate: 220 },
        { number: "404", floor: 4, type: "Executive Suite", status: "available", rate: 380 },
        { number: "405", floor: 4, type: "Deluxe King", status: "available", rate: 220 },
        { number: "406", floor: 4, type: "Presidential Suite", status: "available", rate: 750 },
      ];
      await Room.insertMany(defaultRooms);
      rooms = await Room.find({}).sort({ number: 1 });
    }

    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    next(error);
  }
};

exports.updateRoomStatus = async (req, res, next) => {
  try {
    const { number } = req.params;
    const { status, guest, cleaner } = req.body;

    const updated = await Room.findOneAndUpdate(
      { number },
      { status, ...(guest !== undefined && { guest }), ...(cleaner !== undefined && { cleaner }) },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: `Room ${number} not found.` });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
