const Staff = require("../models/Staff");

exports.getAllStaff = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const filter = {};
    if (department && department !== "all") {
      filter.department = department;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { hotel: { $regex: search, $options: "i" } },
      ];
    }
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, hotel, department, role } = req.body;
    const id = `st-${Date.now()}`;
    const newStaff = await Staff.create({
      id,
      name,
      email,
      phone: phone || "+91 98000 00000",
      hotel: hotel || "Meridian Grand Palace",
      department: department || "Reception",
      role: role || "Staff Member",
      status: "active",
    });
    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    next(error);
  }
};
