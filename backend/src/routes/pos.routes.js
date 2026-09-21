const express = require("express");
const PosController = require("../controllers/pos.controller");
const { identifyTenant } = require("../middleware/tenant");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * Orders
 */
router.get("/orders", identifyTenant, PosController.getOrders);
router.post("/orders", identifyTenant, validate(schemas.posOrder), PosController.createOrder);
router.patch("/orders/:id/status", identifyTenant, PosController.updateOrderStatus);

/**
 * Restaurant Tables
 */
router.get("/tables", PosController.getTables);
router.post("/tables", PosController.createTable);
router.patch("/tables/:id/status", PosController.updateTableStatus);
router.post("/tables/transfer", PosController.transferTable);

/**
 * Kitchen Order Tickets (KOT) for KDS
 */
router.get("/kots", PosController.getKOTs);
router.patch("/kots/:id/status", PosController.updateKOTStatus);

/**
 * Menu Management
 */
router.get("/menu", PosController.getMenu);
router.post("/menu", PosController.createMenuItem);
router.patch("/menu/:id", PosController.updateMenuItem);
router.delete("/menu/:id", PosController.deleteMenuItem);

/**
 * Charge to Guest Room Folio
 */
router.post("/charge-to-room", PosController.chargeToRoom);

module.exports = router;
