const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/search.controller");
const { identifyTenant } = require("../middleware/tenant");

router.get("/", identifyTenant, globalSearch);

module.exports = router;
