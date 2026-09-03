const Organization = require("../models/Organization");
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
    const { name, code, ownerName, ownerEmail, hotelsCount, activeRooms, monthlyRevenue } =
      req.body;

    try {
      const newOrg = new Organization({
        id: `org-${Date.now()}`,
        name,
        code: code.toUpperCase(),
        ownerName: ownerName || "Admin",
        ownerEmail: ownerEmail || "admin@example.com",
        hotelsCount: hotelsCount || 1,
        activeRooms: activeRooms || 50,
        monthlyRevenue: monthlyRevenue || 0,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      });

      await newOrg.save();

      await AuditService.log({
        userId: req.user?.id || "super_admin",
        userRole: "super_admin",
        orgId: newOrg.id,
        action: "CREATE_ORGANIZATION",
        resource: "organizations",
        resourceId: newOrg.id,
        details: { name, code },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: newOrg,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizationsController;
