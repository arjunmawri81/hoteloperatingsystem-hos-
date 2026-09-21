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
 * GET /api/reservations/:id
 */
router.get("/:id", identifyTenant, ReservationsController.getById);

/**
 * POST /api/reservations
 */
router.post(
  "/",
  identifyTenant,
  validate(schemas.reservation),
  ReservationsController.create
);

/**
 * POST /api/reservations/:id/check-in
 */
router.post("/:id/check-in", identifyTenant, ReservationsController.checkIn);

/**
 * POST /api/reservations/:id/check-out
 */
router.post("/:id/check-out", identifyTenant, ReservationsController.checkOut);

/**
 * POST /api/reservations/:id/charge-folio
 */
router.post("/:id/charge-folio", identifyTenant, ReservationsController.chargeFolio);

/**
 * POST /api/reservations/:id/record-payment
 */
router.post("/:id/record-payment", identifyTenant, ReservationsController.recordPayment);

/**
 * POST /api/reservations/:id/pre-checkin (Guest Self Service)
 */
router.post("/:id/pre-checkin", ReservationsController.preCheckIn);

/**
 * POST /api/reservations/:id/web-checkin-link (Generate shareable WhatsApp link)
 */
router.post("/:id/web-checkin-link", identifyTenant, ReservationsController.generateWebCheckInLink);

/**
 * GET /api/reservations/web-checkin/:token (Public Guest View)
 */
router.get("/web-checkin/:token", ReservationsController.getWebCheckInDetails);

/**
 * POST /api/reservations/web-checkin/:token/submit (Guest Submission)
 */
router.post("/web-checkin/:token/submit", ReservationsController.submitWebCheckIn);

/**
 * POST /api/reservations/verify-id (AI OCR Document Extraction)
 */
router.post("/verify-id", ReservationsController.verifyIdDocument);

/**
 * POST /api/reservations/:id/change-room
 */
router.post("/:id/change-room", identifyTenant, ReservationsController.changeRoom);

/**
 * POST /api/reservations/:id/extend
 */
router.post("/:id/extend", identifyTenant, ReservationsController.extendStay);

/**
 * POST /api/reservations/:id/cancel
 */
router.post("/:id/cancel", identifyTenant, ReservationsController.cancelBooking);

/**
 * PATCH /api/reservations/:id/status
 */
router.patch(
  "/:id/status",
  verifyToken,
  identifyTenant,
  ReservationsController.updateStatus
);

/**
 * DELETE /api/reservations/:id
 */
router.delete("/:id", identifyTenant, ReservationsController.delete);

module.exports = router;
