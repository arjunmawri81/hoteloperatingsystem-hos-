const express = require("express");
const HousekeepingController = require("../controllers/housekeeping.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { requireRole } = require("../middleware/rbac");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * GET /api/housekeeping
 */
router.get("/", identifyTenant, HousekeepingController.getAll);
router.post(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["hotel_manager", "housekeeping", "super_admin", "hotel_admin", "ai_receptionist", "receptionist"]),
  HousekeepingController.create
);

/**
 * PATCH /api/housekeeping/:id/status
 * Pipeline: JWT Verify -> Tenant -> RBAC -> Validation -> DB -> Audit -> Response
 */
router.patch(
  "/:id/status",
  verifyToken,
  identifyTenant,
  requireRole(["hotel_manager", "housekeeping", "super_admin", "hotel_admin", "ai_receptionist", "receptionist"]),
  validate(schemas.housekeepingStatus),
  HousekeepingController.updateStatus
);

/**
 * PATCH /api/housekeeping/:id/checklist
 */
router.patch("/:id/checklist", identifyTenant, HousekeepingController.updateChecklist);

/**
 * POST /api/housekeeping/:id/inspect
 */
router.post("/:id/inspect", identifyTenant, HousekeepingController.inspectTask);

module.exports = router;
