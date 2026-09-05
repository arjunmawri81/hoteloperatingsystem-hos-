const Area = require("../models/Area");
const User = require("../models/User");

exports.getAllAreas = async (req, res, next) => {
  try {
    const { search, orgId } = req.query;
    const filter = {};
    if (orgId) {
      filter.orgId = orgId;
    }
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
    const {
      name,
      region,
      manager,
      managerEmail,
      managerPassword,
      hotelsCount,
      totalRooms,
      occupancy,
      revenue,
      orgId,
    } = req.body;

    const effectiveOrgId = orgId || req.tenant?.orgId || "org-1";
    const id = `area-${Date.now()}`;

    const newArea = await Area.create({
      id,
      orgId: effectiveOrgId,
      name,
      region: region || "General Region",
      manager,
      hotelsCount: Number(hotelsCount) || 1,
      totalRooms: Number(totalRooms) || 0,
      occupancy: occupancy || "0%",
      revenue: revenue || "$0",
      status: "active",
    });

    // Automatically create the area_manager user account if login credentials are provided
    if (managerEmail && managerPassword && managerPassword.length >= 6) {
      const emailLower = managerEmail.toLowerCase().trim();
      let existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        existingUser.name = manager.trim();
        existingUser.role = "area_manager";
        existingUser.orgId = effectiveOrgId;
        existingUser.passwordHash = managerPassword.trim();
        await existingUser.save();
      } else {
        const newAreaUser = new User({
          id: `usr-${Date.now()}`,
          name: manager.trim(),
          email: emailLower,
          role: "area_manager",
          orgId: effectiveOrgId,
          passwordHash: managerPassword.trim(),
        });
        await newAreaUser.save();
      }
    }

    res.status(201).json({ success: true, data: newArea });
  } catch (error) {
    next(error);
  }
};
