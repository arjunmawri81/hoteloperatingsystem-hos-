const mongoose = require("mongoose");

const ChannelManagerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
    },
    hotelId: { type: String, required: true, default: "hotel-101" },
    apiKey: { type: String, default: "" },
    hotelCode: { type: String, default: "" },
    status: {
      type: String,
      enum: ["connected", "disconnected", "syncing", "error"],
      default: "connected",
    },
    lastSyncTime: { type: Date, default: Date.now },
    twoWaySyncEnabled: { type: Boolean, default: true },
    syncRate: { type: Boolean, default: true },
    syncAvailability: { type: Boolean, default: true },
    syncReservations: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChannelManager", ChannelManagerSchema);
