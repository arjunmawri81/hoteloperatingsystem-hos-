const mongoose = require("mongoose");

const SyncLogSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, default: "hotel-101" },
    provider: { type: String, required: true },
    syncType: {
      type: String,
      enum: ["availability", "rates", "reservations", "restrictions", "full"],
      default: "full",
    },
    direction: {
      type: String,
      enum: ["outbound_to_ota", "inbound_from_ota"],
      default: "outbound_to_ota",
    },
    status: {
      type: String,
      enum: ["success", "failed", "retrying"],
      default: "success",
    },
    payloadSnippet: { type: String, default: "" },
    recordsAffected: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SyncLog", SyncLogSchema);
