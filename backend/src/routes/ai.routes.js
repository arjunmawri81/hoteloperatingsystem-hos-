const express = require("express");
const AIConversation = require("../models/AIConversation");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/ai/conversations
 */
router.get("/conversations", async (req, res) => {
  const { channel, status } = req.query;
  const filter = {};

  if (channel) {
    filter.channel = channel;
  }
  if (status) {
    filter.status = status;
  }

  try {
    const conversations = await AIConversation.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching AI conversations",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/conversations/:id/messages
 */
router.post("/conversations/:id/messages", async (req, res) => {
  const { message } = req.body;

  try {
    const conv = await AIConversation.findOne({ id: req.params.id });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const reply = `Aura AI: Request acknowledged. "${message}" has been forwarded to guest care.`;
    conv.lastMessage = message;
    conv.timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    await conv.save();

    return res.status(200).json({
      success: true,
      reply,
      timestamp: conv.timestamp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
});

module.exports = router;
