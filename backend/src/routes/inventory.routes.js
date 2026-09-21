const express = require("express");
const router = express.Router();
const {
  getAllInventory,
  createInventoryItem,
  adjustStock,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
  getStockLedger,
  createPurchaseInward,
  getPurchaseInwards,
  createStockIssue,
  getStockIssues,
} = require("../controllers/inventory.controller");
const { identifyTenant } = require("../middleware/tenant");

router.get("/", identifyTenant, getAllInventory);
router.post("/", identifyTenant, createInventoryItem);
router.post("/adjust", identifyTenant, adjustStock);
router.get("/ledger", identifyTenant, getStockLedger);

// GRN & Inward (Video 4)
router.get("/inwards", identifyTenant, getPurchaseInwards);
router.post("/inwards", identifyTenant, createPurchaseInward);

// Departmental Issue (Video 4)
router.get("/issues", identifyTenant, getStockIssues);
router.post("/issues", identifyTenant, createStockIssue);

router.get("/suppliers", identifyTenant, getSuppliers);
router.post("/suppliers", identifyTenant, createSupplier);

router.get("/purchase-orders", identifyTenant, getPurchaseOrders);
router.post("/purchase-orders", identifyTenant, createPurchaseOrder);
router.patch("/purchase-orders/:id/status", identifyTenant, updatePOStatus);

module.exports = router;
