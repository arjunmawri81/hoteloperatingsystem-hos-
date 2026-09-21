const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "system",
    },
    user: {
      type: String,
      default: "",
    },
    userRole: {
      type: String,
      default: "guest",
    },
    orgId: {
      type: String,
      default: "",
    },
    hotelId: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: true,
      default: "SYSTEM_ACTION",
    },
    resource: {
      type: String,
      required: true,
      default: "GENERAL",
    },
    resourceId: {
      type: String,
      default: "",
    },
    oldValue: {
      type: String,
      default: "",
    },
    newValue: {
      type: String,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
