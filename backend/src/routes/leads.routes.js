const express = require("express");
const router = express.Router();
const { identifyTenant } = require("../middleware/tenant");
const {
  getAllLeads,
  createLead,
  advanceLeadStage,
  deleteLead,
  handleWhatsAppWebhook,
  handleChannelWebhook,
} = require("../controllers/leads.controller");

router.get("/", identifyTenant, getAllLeads);
router.post("/", identifyTenant, createLead);
router.patch("/:id/stage", identifyTenant, advanceLeadStage);
router.delete("/:id", identifyTenant, deleteLead);

// Dedicated Inbound Webhooks for WhatsApp & Channel Manager
router.post("/webhook/whatsapp", handleWhatsAppWebhook);
router.post("/webhook/channel", handleChannelWebhook);

module.exports = router;
