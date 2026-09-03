const express = require("express");
const router = express.Router();
const { getAllRooms, updateRoomStatus } = require("../controllers/rooms.controller");

router.get("/", getAllRooms);
router.patch("/:number/status", updateRoomStatus);

module.exports = router;
