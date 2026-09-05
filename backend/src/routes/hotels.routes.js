const express = require("express");
const HotelsController = require("../controllers/hotels.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { requireRole } = require("../middleware/rbac");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * GET /api/hotels
 */
router.get("/", identifyTenant, HotelsController.getAll);

/**
 * GET /api/hotels/:id
 */
router.get("/:id", identifyTenant, HotelsController.getById);

/**
 * POST /api/hotels
 * Pipeline: JWT Verify -> Tenant Identification -> RBAC -> Validation -> DB -> Audit -> Response
 */
router.post(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin"]),
  validate(schemas.hotel),
  HotelsController.create
);

/**
 * DELETE /api/hotels/:id
 */
router.delete(
  "/:id",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin"]),
  HotelsController.delete
);

module.exports = router;
