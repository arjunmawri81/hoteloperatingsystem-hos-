const express = require("express");
const ReservationsController = require("../controllers/reservations.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * GET /api/reservations
 */
router.get("/", identifyTenant, ReservationsController.getAll);

/**
 * POST /api/reservations
 * Pipeline: Tenant Identification -> Validation -> Business Rules -> DB -> Audit -> Notify -> Response
 */
router.post(
  "/",
  identifyTenant,
  validate(schemas.reservation),
  ReservationsController.create
);

/**
 * PATCH /api/reservations/:id/status
 * Pipeline: JWT Verify -> Tenant Identification -> Update Status -> Audit -> Response
 */
router.patch(
  "/:id/status",
  verifyToken,
  identifyTenant,
  ReservationsController.updateStatus
);

module.exports = router;
