const mongoose = require("mongoose");
const Room = require("../models/Room");

exports.getAllRooms = async (req, res, next) => {
  try {
    const { floor, status, hotelId, orgId, hotelName } = req.query;
    const filter = {};
    if (floor) filter.floor = Number(floor);
    if (status && status !== "all") filter.status = status;

    const userRole = req.user?.role || req.tenant?.role;
    let targetOrgId = req.user?.orgId || req.tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = orgId || req.tenant?.orgId || null;
    } else if (!targetOrgId && orgId && orgId !== "all" && orgId !== "org-1") {
      targetOrgId = orgId;
    }

    const targetHotelId = hotelId || (userRole !== "area_manager" && (req.tenant?.hotelId || req.user?.hotelId));
    const targetHotelName = hotelName || (userRole !== "area_manager" && (req.tenant?.hotelName || req.user?.hotelName));

    if (userRole === "super_admin" && !targetHotelId && !targetHotelName && !targetOrgId) {
      // super_admin sees all if no filter
    } else if (targetHotelId) {
      filter.hotelId = targetHotelId;
    } else if (targetHotelName && targetHotelName !== "All" && targetHotelName !== "Main Property") {
      filter.hotelName = new RegExp(`^${targetHotelName.trim()}$`, "i");
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;

      if (userRole === "area_manager") {
        const assignedNames = req.user?.assignedHotelNames || [];
        const assignedIds = req.user?.assignedHotelIds || [];
        if (assignedNames.length > 0 || assignedIds.length > 0) {
          const orConditions = [];
          if (assignedNames.length > 0) orConditions.push({ hotelName: { $in: assignedNames } });
          if (assignedIds.length > 0) orConditions.push({ hotelId: { $in: assignedIds } });
          filter.$or = orConditions;
        }
      }
    } else if (userRole && userRole !== "super_admin") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

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

    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId || "hotel-101";
    const targetHotelName = hotelName || req.tenant?.hotelName || req.user?.hotelName || "Main Property";
    const targetOrgId = req.user?.orgId || req.tenant?.orgId || orgId || "org-1";

    const roomNumber = String(number).trim();
    const existing = await Room.findOne({ number: roomNumber, hotelId: targetHotelId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Room unit ${roomNumber} already exists in this hotel.`,
      });
    }

    const newRoom = await Room.create({
      number: roomNumber,
      floor: Number(floor),
      type: type || "Standard Room",
      rate: Number(rate) || 2500,
      hotelId: targetHotelId,
      hotelName: targetHotelName,
      orgId: targetOrgId,
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

    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId || "hotel-101";
    const targetHotelName = hotelName || req.tenant?.hotelName || req.user?.hotelName || "Main Property";
    const targetOrgId = req.user?.orgId || req.tenant?.orgId || orgId || "org-1";

    const inserted = [];

    for (const r of rooms) {
      if (!r.number || !r.floor) continue;
      const roomNumber = String(r.number).trim();
      const hId = r.hotelId || targetHotelId;
      const hName = r.hotelName || targetHotelName;
      const oId = r.orgId || targetOrgId;

      const existing = await Room.findOne({ number: roomNumber, hotelId: hId });
      if (existing) {
        existing.floor = Number(r.floor);
        if (r.type) existing.type = r.type;
        if (r.rate !== undefined) existing.rate = Number(r.rate);
        if (r.status) existing.status = r.status;
        existing.hotelId = hId;
        existing.hotelName = hName;
        existing.orgId = oId;
        await existing.save();
        inserted.push(existing);
      } else {
        const doc = await Room.create({
          number: roomNumber,
          floor: Number(r.floor),
          type: r.type || "Standard Room",
          rate: Number(r.rate) || 2500,
          hotelId: hId,
          hotelName: hName,
          orgId: oId,
          status: r.status || "available",
        });
        inserted.push(doc);
      }
    }

    const allRooms = await Room.find({ orgId: targetOrgId, hotelId: targetHotelId }).sort({ number: 1 });
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

    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId || "hotel-101";
    const targetHotelName = hotelName || req.tenant?.hotelName || req.user?.hotelName || "Main Property";
    const targetOrgId = req.user?.orgId || req.tenant?.orgId || orgId || "org-1";

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
          hotelId: targetHotelId,
          hotelName: targetHotelName,
          orgId: targetOrgId,
          status: "available",
        });
      }
    }

    // Upsert or insert ignore duplicates
    const inserted = [];
    for (const r of generated) {
      const exists = await Room.findOne({ number: r.number, hotelId: targetHotelId });
      if (!exists) {
        const doc = await Room.create(r);
        inserted.push(doc);
      }
    }

    const allRooms = await Room.find({ orgId: targetOrgId, hotelId: targetHotelId }).sort({ number: 1 });

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
    const { status, guest, cleaner, rate, type, hotelId } = req.body;

    const filter = { number: String(number) };
    const userRole = req.user?.role || req.tenant?.role;
    const targetHotelId = hotelId || (userRole !== "super_admin" && (req.user?.hotelId || req.tenant?.hotelId));
    if (targetHotelId) filter.hotelId = targetHotelId;

    const targetOrgId = userRole !== "super_admin" && (req.user?.orgId || req.tenant?.orgId);
    if (targetOrgId) filter.orgId = targetOrgId;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (guest !== undefined) updateFields.guest = guest;
    if (cleaner !== undefined) updateFields.cleaner = cleaner;
    if (rate !== undefined) updateFields.rate = Number(rate);
    if (type !== undefined) updateFields.type = type;

    const updated = await Room.findOneAndUpdate(
      filter,
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
    const userRole = req.user?.role || req.tenant?.role;
    const targetHotelId = userRole !== "super_admin" && (req.user?.hotelId || req.tenant?.hotelId);
    const targetOrgId = userRole !== "super_admin" && (req.user?.orgId || req.tenant?.orgId);

    const filter = {};
    if (mongoose.Types.ObjectId.isValid(number)) {
      filter.$or = [{ number: String(number) }, { _id: number }];
    } else {
      filter.number = String(number);
    }
    if (targetHotelId) filter.hotelId = targetHotelId;
    if (targetOrgId) filter.orgId = targetOrgId;

    const deleted = await Room.findOneAndDelete(filter);
    res.status(200).json({ success: true, message: `Room ${number} deleted.`, data: deleted });
  } catch (error) {
    next(error);
  }
};

exports.getTapeChart = async (req, res, next) => {
  try {
    const Reservation = require("../models/Reservation");
    const { startDate, days = 14 } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < Number(days); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const rooms = await Room.find({}).sort({ floor: 1, number: 1 });
    const reservations = await Reservation.find({
      status: { $in: ["confirmed", "checked_in"] },
    });

    const tapeChart = rooms.map((r) => {
      const roomResvs = reservations.filter((resv) => resv.roomNumber === r.number);
      const calendar = dates.map((dateStr) => {
        const activeResv = roomResvs.find((resv) => {
          return dateStr >= resv.checkIn && dateStr < resv.checkOut;
        });
        return {
          date: dateStr,
          occupied: !!activeResv,
          status: activeResv ? activeResv.status : r.status,
          reservation: activeResv
            ? {
                id: activeResv.id,
                guestName: activeResv.guestName,
                status: activeResv.status,
                checkIn: activeResv.checkIn,
                checkOut: activeResv.checkOut,
              }
            : null,
        };
      });

      return {
        roomNumber: r.number,
        floor: r.floor,
        type: r.type,
        rate: r.rate,
        status: r.status,
        calendar,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        dates,
        tapeChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

