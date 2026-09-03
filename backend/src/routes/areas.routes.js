const express = require("express");
const router = express.Router();
const { getAllAreas, createArea } = require("../controllers/areas.controller");

router.get("/", getAllAreas);
router.post("/", createArea);

module.exports = router;
