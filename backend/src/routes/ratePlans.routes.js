const express = require("express");
const router = express.Router();
const { getAllRatePlans, createRatePlan } = require("../controllers/ratePlans.controller");
const { identifyTenant } = require("../middleware/tenant");

router.get("/", identifyTenant, getAllRatePlans);
router.post("/", identifyTenant, createRatePlan);

module.exports = router;
