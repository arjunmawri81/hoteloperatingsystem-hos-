const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  createRoom,
  createBulkRooms,
  batchGenerateRooms,
  updateRoomStatus,
  deleteRoom,
} = require("../controllers/rooms.controller");

router.get("/", getAllRooms);
router.post("/", createRoom);
router.post("/bulk", createBulkRooms);
router.post("/batch", batchGenerateRooms);
router.patch("/:number/status", updateRoomStatus);
router.delete("/:number", deleteRoom);


module.exports = router;

