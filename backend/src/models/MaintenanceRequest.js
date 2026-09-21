const mongoose = require("mongoose");

const MaintenanceRequestSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    hotelId: { type: String, required: true, default: "hotel-101" },
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      default: "General",
    },
    issueDescription: { type: String, default: "" },
    reportedBy: { type: String, default: "In-Stay Guest" },
    assignedTo: { type: String, default: "Maintenance Team" },
    priority: {
      type: String,
      default: "high",
    },
    status: {
      type: String,
      enum: ["reported", "in_progress", "resolved", "cancelled"],
      default: "reported",
    },
    resolutionNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);
