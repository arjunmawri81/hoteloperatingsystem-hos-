const express = require("express");
const { mockRestaurantOrders } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/pos/orders
 */
router.get("/orders", (req, res) => {
  const { status } = req.query;
  let result = [...mockRestaurantOrders];

  if (status) {
    result = result.filter((o) => o.status === status);
  }

  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * POST /api/pos/orders
 */
router.post("/orders", (req, res) => {
  const { tableNumber, roomNumber, items, total, status } = req.body;

  const newOrder = {
    id: `POS-${Math.floor(400 + Math.random() * 600)}`,
    tableNumber: tableNumber || "T-01",
    roomNumber: roomNumber || undefined,
    items: items || ["Kitchen Order"],
    total: Number(total) || 1000,
    status: status || "cooking",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  mockRestaurantOrders.unshift(newOrder);

  return res.status(201).json({
    success: true,
    message: "POS Order created successfully",
    data: newOrder,
  });
});

module.exports = router;
