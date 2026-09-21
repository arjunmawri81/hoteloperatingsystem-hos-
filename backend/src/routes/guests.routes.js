const express = require("express");
const router = express.Router();
const {
  getAllGuests,
  lookupGuestByPhone,
  createGuest,
  getGuestHistory,
  getComplaints,
  createComplaint,
  updateComplaint,
} = require("../controllers/guests.controller");

router.get("/lookup", lookupGuestByPhone);
router.get("/", getAllGuests);
router.post("/", createGuest);
router.get("/history/:guestName", getGuestHistory);

router.get("/complaints", getComplaints);
router.post("/complaints", createComplaint);
router.patch("/complaints/:id", updateComplaint);

module.exports = router;
