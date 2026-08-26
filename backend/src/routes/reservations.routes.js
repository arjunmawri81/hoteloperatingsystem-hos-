const express = require("express");
const { mockReservations } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/reservations
 */
router.get("/", (req, res) => {
  const { hotelName, status, guestEmail } = req.query;
  let result = [...mockReservations];

  if (hotelName) {
    result = result.filter((r) =>
      r.hotelName.toLowerCase().includes(hotelName.toLowerCase())
    );
  }
  if (status) {
    result = result.filter((r) => r.status === status);
  }
  if (guestEmail) {
    result = result.filter((r) =>
      r.guestEmail.toLowerCase() === guestEmail.toLowerCase()
    );
  }

  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * POST /api/reservations
 */
router.post("/", (req, res) => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    hotelName,
    roomNumber,
    roomType,
    checkIn,
    checkOut,
    totalAmount,
    paidAmount,
    source,
  } = req.body;

  if (!guestName || !checkIn || !checkOut) {
    return res.status(400).json({
      success: false,
      message: "guestName, checkIn, and checkOut are required",
    });
  }

  const newReservation = {
    id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
    guestName,
    guestEmail: guestEmail || "guest@example.com",
    guestPhone: guestPhone || "+91 90000 00000",
    hotelName: hotelName || "Meridian Grand Palace",
    roomNumber: roomNumber || "TBD",
    roomType: roomType || "Deluxe King",
    checkIn,
    checkOut,
    status: "confirmed",
    totalAmount: Number(totalAmount) || 15000,
    paidAmount: Number(paidAmount) || 0,
    source: source || "Web Direct",
  };

  mockReservations.unshift(newReservation);

  return res.status(201).json({
    success: true,
    message: "Reservation confirmed successfully",
    data: newReservation,
  });
});

/**
 * PATCH /api/reservations/:id/status
 */
router.patch("/:id/status", verifyToken, (req, res) => {
  const { status } = req.body;
  const reservation = mockReservations.find((r) => r.id === req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: "Reservation not found",
    });
  }

  reservation.status = status;

  return res.status(200).json({
    success: true,
    message: `Reservation status updated to ${status}`,
    data: reservation,
  });
});

module.exports = router;
