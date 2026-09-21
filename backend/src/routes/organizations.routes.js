const express = require("express");
const OrganizationsController = require("../controllers/organizations.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

/**
 * GET /api/organizations
 * Super Admin only
 */
router.get(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin"]),
  OrganizationsController.getAll
);

/**
 * GET /api/organizations/:id
 */
router.get(
  "/:id",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin"]),
  OrganizationsController.getById
);

/**
 * POST /api/organizations
 */
router.post(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin"]),
  OrganizationsController.create
);

/**
 * PATCH /api/organizations/:id/approve
 */
router.patch(
  "/:id/approve",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin"]),
  OrganizationsController.approveOrganization
);

/**
 * PATCH /api/organizations/:id/reject
 */
router.patch(
  "/:id/reject",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin"]),
  OrganizationsController.rejectOrganization
);

module.exports = router;
