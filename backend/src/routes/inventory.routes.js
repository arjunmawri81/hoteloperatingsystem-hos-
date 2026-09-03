const express = require("express");
const router = express.Router();
const {
  getAllInventory,
  createInventoryItem,
  adjustStock,
} = require("../controllers/inventory.controller");

router.get("/", getAllInventory);
router.post("/", createInventoryItem);
router.patch("/:sku/adjust", adjustStock);

module.exports = router;
