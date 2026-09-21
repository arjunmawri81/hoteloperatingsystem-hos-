const Staff = require("../models/Staff");
const User = require("../models/User");

exports.getAllStaff = async (req, res, next) => {
  try {
    const { department, search, orgId, hotelId, hotelName } = req.query;
    const filter = {};

    const userRole = req.user?.role || req.tenant?.role;
    let targetOrgId = req.user?.orgId || req.tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = orgId || req.tenant?.orgId || null;
    } else if (!targetOrgId && orgId && orgId !== "all" && orgId !== "org-1") {
      targetOrgId = orgId;
    }

    const targetHotelId = hotelId || req.tenant?.hotelId || req.user?.hotelId;
    const targetHotelName = hotelName || req.tenant?.hotelName || req.user?.hotelName;

    if (userRole === "super_admin" && !targetOrgId && !targetHotelId && !targetHotelName) {
      // Super admin can see all if no filter is passed
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;

      if (userRole === "area_manager") {
        const assignedNames = req.user?.assignedHotelNames || [];
        if (assignedNames.length > 0) {
          filter.$or = [
            { hotel: { $in: assignedNames } },
            { assignedHotelNames: { $in: assignedNames } },
          ];
        }
      } else if (userRole === "hotel_manager" || userRole === "receptionist" || userRole === "housekeeping") {
        if (targetHotelName) {
          filter.$or = [
            { hotel: new RegExp(`^${targetHotelName.trim()}$`, "i") },
            { assignedHotelNames: targetHotelName.trim() },
          ];
        } else if (targetHotelId) {
          filter.hotelId = targetHotelId;
        }
      } else if (targetHotelId) {
        filter.hotelId = targetHotelId;
      }
    } else if (userRole && userRole !== "super_admin") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    if (department && department !== "all") {
      filter.department = department;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCondition = [
        { name: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
        { hotel: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, hotel, assignedHotelNames, department, role, systemRole, password, orgId } = req.body;
    
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

    const hotelNamesList = Array.isArray(assignedHotelNames) && assignedHotelNames.length > 0
      ? assignedHotelNames
      : (hotel ? [hotel] : []);

    const Hotel = require("../models/Hotel");
    const primaryHotelName = hotelNamesList[0] || hotel || "Main Property";
    let matchedHotel = null;
    if (primaryHotelName) {
      matchedHotel = await Hotel.findOne({
        orgId: effectiveOrgId,
        name: new RegExp(`^${primaryHotelName.trim()}$`, "i"),
      });
    }
    const resolvedHotelId = matchedHotel ? matchedHotel.id : "";

    const id = `st-${Date.now()}`;
    const newStaff = await Staff.create({
      id,
      orgId: effectiveOrgId,
      name: name.trim(),
      email: emailLower,
      phone: phone || "+91 98000 00000",
      hotel: hotelNamesList.join(", ") || hotel || "Main Property",
      hotelId: resolvedHotelId,
      assignedHotelNames: hotelNamesList,
      assignedHotelIds: resolvedHotelId ? [resolvedHotelId] : [],
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
        existingUser.hotelId = resolvedHotelId;
        existingUser.hotelName = primaryHotelName;
        existingUser.assignedHotelNames = hotelNamesList;
        existingUser.assignedHotelIds = resolvedHotelId ? [resolvedHotelId] : [];
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
          hotelId: resolvedHotelId,
          hotelName: primaryHotelName,
          assignedHotelNames: hotelNamesList,
          assignedHotelIds: resolvedHotelId ? [resolvedHotelId] : [],
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
