const Staff = require("../models/Staff");
const User = require("../models/User");

exports.getAllStaff = async (req, res, next) => {
  try {
    const { department, search, orgId } = req.query;
    const filter = {};
    if (orgId) {
      filter.orgId = orgId;
    }
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
    const { name, email, phone, hotel, department, role, systemRole, password, orgId } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Staff name and email are required.",
      });
    }

    const emailLower = email.toLowerCase().trim();
    const effectiveOrgId = orgId || req.tenant?.orgId || "org-1";
    const assignedRole = systemRole || "receptionist";
    const staffPassword = (password || "").trim();

    const id = `st-${Date.now()}`;
    const newStaff = await Staff.create({
      id,
      orgId: effectiveOrgId,
      name: name.trim(),
      email: emailLower,
      phone: phone || "+91 98000 00000",
      hotel: hotel || "Main Property",
      department: department || "Reception",
      role: role || "Staff Member",
      status: "active",
    });

    // Create or update login User account in users collection if password is provided
    if (staffPassword && staffPassword.length >= 6) {
      let existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        existingUser.name = name.trim();
        existingUser.role = assignedRole;
        existingUser.orgId = effectiveOrgId;
        existingUser.hotelName = hotel || "Main Property";
        existingUser.passwordHash = staffPassword; // Pre-save hook will hash it
        await existingUser.save();
      } else {
        const newUser = new User({
          id: `usr-${Date.now()}`,
          name: name.trim(),
          email: emailLower,
          phone: phone || "",
          role: assignedRole,
          orgId: effectiveOrgId,
          hotelName: hotel || "Main Property",
          passwordHash: staffPassword, // Pre-save hook will hash it
        });
        await newUser.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Staff member and login account created successfully",
      data: newStaff,
    });
  } catch (error) {
    next(error);
  }
};
