const express = require("express");
const { mockAIConversations } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/ai/conversations
 */
router.get("/conversations", (req, res) => {
  const { channel, status } = req.query;
  let result = [...mockAIConversations];

  if (channel) {
    result = result.filter((c) => c.channel === channel);
  }
  if (status) {
    result = result.filter((c) => c.status === status);
  }

  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * POST /api/ai/conversations/:id/messages
 */
router.post("/conversations/:id/messages", (req, res) => {
  const { message } = req.body;
  const conv = mockAIConversations.find((c) => c.id === req.params.id);

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

  return res.status(200).json({
    success: true,
    reply,
    timestamp: conv.timestamp,
  });
});

module.exports = router;
