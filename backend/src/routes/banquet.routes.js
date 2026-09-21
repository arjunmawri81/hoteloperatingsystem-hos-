const express = require("express");
const BanquetController = require("../controllers/banquet.controller");

const router = express.Router();

router.get("/halls", BanquetController.getHalls);
router.post("/halls", BanquetController.createHall);
router.get("/bookings", BanquetController.getBookings);
router.post("/bookings", BanquetController.createBooking);
router.patch("/bookings/:id/status", BanquetController.updateBookingStatus);
router.patch("/bookings/:id/settle", BanquetController.settlePayment);

module.exports = router;
