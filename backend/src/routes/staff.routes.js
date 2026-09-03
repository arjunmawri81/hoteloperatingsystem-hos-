const express = require("express");
const router = express.Router();
const { getAllStaff, createStaff } = require("../controllers/staff.controller");

router.get("/", getAllStaff);
router.post("/", createStaff);

module.exports = router;
