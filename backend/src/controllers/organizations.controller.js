const Organization = require("../models/Organization");
const User = require("../models/User");
const AuditService = require("../services/audit.service");

class OrganizationsController {
  static async getAll(req, res, next) {
    try {
      const orgs = await Organization.find({});
      return res.status(200).json({
        success: true,
        count: orgs.length,
        data: orgs,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const org = await Organization.findOne({ id: req.params.id });
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: org,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    const {
      name,
      code,
      ownerName,
      ownerEmail,
      ownerPassword,
      password,
      hotelsCount,
      activeRooms,
      monthlyRevenue,
    } = req.body;

    try {
      const rawPassword = (password || ownerPassword || "").trim();
      if (!rawPassword || rawPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Please enter a password (min 6 characters) for the organization owner account.",
        });
      }

      if (!ownerEmail || !ownerEmail.trim()) {
        return res.status(400).json({
          success: false,
          message: "Owner email is required.",
        });
      }

      const formattedCode = (code || name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4)).toUpperCase();
      const newOrgId = `org-${formattedCode.toLowerCase()}-${Date.now()}`;
      const emailLower = ownerEmail.toLowerCase().trim();
      const initialPassword = rawPassword;

      const newOrg = new Organization({
        id: newOrgId,
        name,
        code: formattedCode,
        ownerName: ownerName || "Admin",
        ownerEmail: emailLower,
        hotelsCount: hotelsCount || 1,
        activeRooms: activeRooms || 50,
        monthlyRevenue: monthlyRevenue || 0,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      });

      await newOrg.save();

      // Automatically create the Hotel Admin User in the users collection
      let existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        existingUser.orgId = newOrg.id;
        existingUser.orgName = newOrg.name;
        existingUser.role = "hotel_admin";
        existingUser.passwordHash = initialPassword; // Pre-save hook will hash it
        await existingUser.save();
      } else {
        const newAdminUser = new User({
          id: `usr-${Date.now()}`,
          name: ownerName || "Hotel Administrator",
          email: emailLower,
          role: "hotel_admin",
          orgId: newOrg.id,
          orgName: newOrg.name,
          passwordHash: initialPassword, // Pre-save hook will hash it
        });
        await newAdminUser.save();
      }

      await AuditService.log({
        userId: req.user?.id || "super_admin",
        userRole: "super_admin",
        orgId: newOrg.id,
        action: "CREATE_ORGANIZATION",
        resource: "organizations",
        resourceId: newOrg.id,
        details: { name, code: formattedCode, ownerEmail: emailLower },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: "Organization and owner user account created successfully",
        data: newOrg,
        credentials: {
          email: emailLower,
          password: initialPassword,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizationsController;
