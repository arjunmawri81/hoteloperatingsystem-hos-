const express = require("express");
const router = express.Router();
const { getRestrictions, setRestriction } = require("../controllers/inventoryRestrictions.controller");
const { identifyTenant } = require("../middleware/tenant");

router.get("/", identifyTenant, getRestrictions);
router.post("/", identifyTenant, setRestriction);

module.exports = router;
