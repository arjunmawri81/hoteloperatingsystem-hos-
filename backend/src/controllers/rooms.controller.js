const mongoose = require("mongoose");
const Room = require("../models/Room");

exports.getAllRooms = async (req, res, next) => {
  try {
    const { floor, status, hotelId, orgId } = req.query;
    const filter = {};
    if (floor) filter.floor = Number(floor);
    if (status && status !== "all") filter.status = status;
    if (hotelId) filter.hotelId = hotelId;
    if (orgId) filter.orgId = orgId;

    const rooms = await Room.find(filter).sort({ number: 1 });
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    next(error);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { number, floor, type, rate, hotelId, hotelName, orgId, status } = req.body;

    if (!number || !floor) {
      return res.status(400).json({
        success: false,
        message: "Room number and floor are required.",
      });
    }

    const roomNumber = String(number).trim();
    const existing = await Room.findOne({ number: roomNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Room unit ${roomNumber} already exists in database.`,
      });
    }

    const newRoom = await Room.create({
      number: roomNumber,
      floor: Number(floor),
      type: type || "Standard Room",
      rate: Number(rate) || 2500,
      hotelId: hotelId || "hotel-101",
      hotelName: hotelName || "Main Property",
      orgId: orgId || req.tenant?.orgId || "org-1",
      status: status || "available",
    });

    res.status(201).json({
      success: true,
      message: `Room ${newRoom.number} created successfully`,
      data: newRoom,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBulkRooms = async (req, res, next) => {
  try {
    const { rooms = [], hotelId, hotelName, orgId } = req.body;
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ success: false, message: "No rooms array provided." });
    }

    const inserted = [];

    for (const r of rooms) {
      if (!r.number || !r.floor) continue;
      const roomNumber = String(r.number).trim();
      const existing = await Room.findOne({ number: roomNumber });
      if (existing) {
        existing.floor = Number(r.floor);
        if (r.type) existing.type = r.type;
        if (r.rate !== undefined) existing.rate = Number(r.rate);
        if (r.status) existing.status = r.status;
        if (r.hotelId || hotelId) existing.hotelId = r.hotelId || hotelId;
        if (r.hotelName || hotelName) existing.hotelName = r.hotelName || hotelName;
        if (r.orgId || orgId) existing.orgId = r.orgId || orgId || req.tenant?.orgId || "org-1";
        await existing.save();
        inserted.push(existing);
      } else {
        const doc = await Room.create({
          number: roomNumber,
          floor: Number(r.floor),
          type: r.type || "Standard Room",
          rate: Number(r.rate) || 2500,
          hotelId: r.hotelId || hotelId || "hotel-101",
          hotelName: r.hotelName || hotelName || "Main Property",
          orgId: r.orgId || orgId || req.tenant?.orgId || "org-1",
          status: r.status || "available",
        });
        inserted.push(doc);
      }
    }

    const allRooms = await Room.find(orgId ? { orgId } : {}).sort({ number: 1 });
    res.status(201).json({
      success: true,
      message: `Successfully saved ${inserted.length} custom room units`,
      count: inserted.length,
      data: allRooms,
    });
  } catch (error) {
    next(error);
  }
};


exports.batchGenerateRooms = async (req, res, next) => {
  try {
    const { hotelId, hotelName, orgId } = req.body;
    const totalRooms = Number(req.body.totalRooms) || 12;
    const floors = Number(req.body.floors) || 2;
    const defaultRate = Number(req.body.defaultRate) || 2500;

    const roomsPerFloor = Math.ceil(totalRooms / floors);
    const types = ["Standard Room", "Deluxe King", "Executive Suite"];
    const generated = [];

    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        if (generated.length >= totalRooms) break;
        const roomNum = `${f}${r < 10 ? `0${r}` : r}`;
        const roomType = types[(r - 1) % types.length];
        const rate = roomType === "Executive Suite" ? defaultRate * 1.8 : roomType === "Deluxe King" ? defaultRate * 1.3 : defaultRate;

        generated.push({
          number: roomNum,
          floor: f,
          type: roomType,
          rate: Math.round(rate),
          hotelId: hotelId || "hotel-101",
          hotelName: hotelName || "Main Property",
          orgId: orgId || req.tenant?.orgId || "org-1",
          status: "available",
        });
      }
    }

    // Upsert or insert ignore duplicates
    const inserted = [];
    for (const r of generated) {
      const exists = await Room.findOne({ number: r.number });
      if (!exists) {
        const doc = await Room.create(r);
        inserted.push(doc);
      }
    }

    const allRooms = await Room.find(orgId ? { orgId } : {}).sort({ number: 1 });

    res.status(201).json({
      success: true,
      message: `Successfully generated ${inserted.length} room units`,
      data: allRooms,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRoomStatus = async (req, res, next) => {
  try {
    const { number } = req.params;
    const { status, guest, cleaner, rate, type } = req.body;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (guest !== undefined) updateFields.guest = guest;
    if (cleaner !== undefined) updateFields.cleaner = cleaner;
    if (rate !== undefined) updateFields.rate = Number(rate);
    if (type !== undefined) updateFields.type = type;

    const updated = await Room.findOneAndUpdate(
      { number },
      updateFields,
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

exports.deleteRoom = async (req, res, next) => {
  try {
    const { number } = req.params;
    const query = mongoose.Types.ObjectId.isValid(number)
      ? { $or: [{ number: String(number) }, { _id: number }] }
      : { number: String(number) };

    const deleted = await Room.findOneAndDelete(query);
    res.status(200).json({ success: true, message: `Room ${number} deleted.`, data: deleted });
  } catch (error) {
    next(error);
  }
};

