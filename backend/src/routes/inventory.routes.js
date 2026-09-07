const express = require("express");
const router = express.Router();
const {
  getAllInventory,
  createInventoryItem,
  adjustStock,
} = require("../controllers/inventory.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { requireRole } = require("../middleware/rbac");

router.get(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  getAllInventory
);

router.post(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  createInventoryItem
);

router.patch(
  "/:sku/adjust",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  adjustStock
);

module.exports = router;
