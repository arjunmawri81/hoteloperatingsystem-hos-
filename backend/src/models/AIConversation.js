const mongoose = require("mongoose");

const AIConversationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestPhone: {
      type: String,
      default: "",
    },
    channel: {
      type: String,
      enum: ["WhatsApp", "Web Widget", "Voice Bot"],
      default: "WhatsApp",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    intent: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ai_handling", "escalated_to_staff", "resolved"],
      default: "ai_handling",
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    timestamp: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIConversation", AIConversationSchema);
