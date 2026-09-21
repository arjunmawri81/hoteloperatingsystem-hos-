const express = require("express");
const ChannelManagerController = require("../controllers/channelManager.controller");

const router = express.Router();

router.get("/channels", ChannelManagerController.getChannels);
router.post("/channels", ChannelManagerController.addChannel);
router.delete("/channels/:id", ChannelManagerController.deleteChannel);

router.get("/mappings", ChannelManagerController.getMappings);
router.post("/mappings", ChannelManagerController.addMapping);
router.delete("/mappings/:id", ChannelManagerController.deleteMapping);

router.post("/sync", ChannelManagerController.triggerSync);
router.patch("/restrictions/:id", ChannelManagerController.updateRestriction);
router.get("/logs", ChannelManagerController.getSyncLogs);

module.exports = router;
