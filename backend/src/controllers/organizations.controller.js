const Organization = require("../models/Organization");
const User = require("../models/User");
const AuditService = require("../services/audit.service");

class OrganizationsController {
  static async getAll(req, res, next) {
    try {
      const orgs = await Organization.find({}).sort({ createdAt: -1 });
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
      ownerPhone,
      ownerPassword,
      password,
      hotelsCount,
      activeRooms,
      monthlyRevenue,
      status,
      kycDocuments,
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
        ownerPhone: ownerPhone || "",
        hotelsCount: hotelsCount || 1,
        activeRooms: activeRooms || 50,
        monthlyRevenue: monthlyRevenue || 0,
        status: status || "active",
        kycDocuments: kycDocuments || {},
        createdAt: new Date().toISOString().split("T")[0],
      });

      await newOrg.save();

      // Automatically create the Hotel Admin User in the users collection
      let existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        existingUser.orgId = newOrg.id;
        existingUser.orgName = newOrg.name;
        existingUser.role = "hotel_admin";
        existingUser.passwordHash = initialPassword;
        await existingUser.save();
      } else {
        const newAdminUser = new User({
          id: `usr-${Date.now()}`,
          name: ownerName || "Hotel Administrator",
          email: emailLower,
          phone: ownerPhone || "",
          role: "hotel_admin",
          orgId: newOrg.id,
          orgName: newOrg.name,
          passwordHash: initialPassword,
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
        message: "Organization created successfully",
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

  // --- Approve Organization (Super Admin) ---
  static async approveOrganization(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const org = await Organization.findOne({ id });
      if (!org) {
        return res.status(404).json({ success: false, message: "Organization not found" });
      }

      org.status = "active";
      org.kycDocuments = org.kycDocuments || {};
      org.kycDocuments.approvedBy = req.user?.name || "Super Admin";
      org.kycDocuments.approvedAt = new Date();
      org.kycDocuments.approvalRemarks = remarks || "KYC documents verified and approved by Super Admin";
      org.kycDocuments.rejectionReason = "";
      await org.save();

      // Ensure owner user account is active
      if (org.ownerEmail) {
        await User.updateMany(
          { email: org.ownerEmail.toLowerCase() },
          { $set: { orgId: org.id, orgName: org.name } }
        );
      }

      await AuditService.log({
        userId: req.user?.id || "super_admin",
        userRole: "super_admin",
        orgId: org.id,
        action: "APPROVE_ORGANIZATION",
        resource: "organizations",
        resourceId: org.id,
        details: { name: org.name, approvedBy: req.user?.name, remarks },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: `Organization "${org.name}" has been APPROVED and activated.`,
        data: org,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Reject Organization (Super Admin) ---
  static async rejectOrganization(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const org = await Organization.findOne({ id });
      if (!org) {
        return res.status(404).json({ success: false, message: "Organization not found" });
      }

      org.status = "rejected";
      org.kycDocuments = org.kycDocuments || {};
      org.kycDocuments.rejectionReason = reason || "KYC documents could not be verified";
      await org.save();

      await AuditService.log({
        userId: req.user?.id || "super_admin",
        userRole: "super_admin",
        orgId: org.id,
        action: "REJECT_ORGANIZATION",
        resource: "organizations",
        resourceId: org.id,
        details: { name: org.name, reason },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: `Organization "${org.name}" registration has been REJECTED.`,
        data: org,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizationsController;
