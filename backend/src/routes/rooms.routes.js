const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  createRoom,
  createBulkRooms,
  batchGenerateRooms,
  updateRoomStatus,
  deleteRoom,
  getTapeChart,
} = require("../controllers/rooms.controller");
const { verifyToken } = require("../middleware/auth");
const { identifyTenant } = require("../middleware/tenant");
const { requireRole } = require("../middleware/rbac");

router.get("/tape-chart", identifyTenant, getTapeChart);
router.get("/", identifyTenant, getAllRooms);

router.post(
  "/",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  createRoom
);

router.post(
  "/bulk",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  createBulkRooms
);

router.post(
  "/batch",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  batchGenerateRooms
);

router.patch(
  "/:number/status",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping", "ai_receptionist"]),
  updateRoomStatus
);

router.delete(
  "/:number",
  verifyToken,
  identifyTenant,
  requireRole(["super_admin", "hotel_admin", "hotel_manager"]),
  deleteRoom
);

module.exports = router;
