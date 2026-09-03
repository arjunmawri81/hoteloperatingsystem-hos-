const express = require("express");
const router = express.Router();
const {
  getAllLeads,
  createLead,
  advanceLeadStage,
} = require("../controllers/leads.controller");

router.get("/", getAllLeads);
router.post("/", createLead);
router.patch("/:id/stage", advanceLeadStage);

module.exports = router;
