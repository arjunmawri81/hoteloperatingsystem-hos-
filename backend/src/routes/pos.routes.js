const express = require("express");
const PosController = require("../controllers/pos.controller");
const { identifyTenant } = require("../middleware/tenant");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * GET /api/pos/orders
 */
router.get("/orders", identifyTenant, PosController.getOrders);

/**
 * POST /api/pos/orders
 * Pipeline: Tenant -> Validation -> DB -> Audit -> Notify Kitchen -> Response
 */
router.post(
  "/orders",
  identifyTenant,
  validate(schemas.posOrder),
  PosController.createOrder
);

/**
 * PATCH /api/pos/orders/:id/status
 */
router.patch(
  "/orders/:id/status",
  identifyTenant,
  PosController.updateOrderStatus
);

module.exports = router;
