const mongoose = require("mongoose");

const MaintenanceRequestSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    hotelId: { type: String, required: true, default: "hotel-101" },
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ["Air Conditioning (HVAC)", "Plumbing / Water", "Electrical & Lighting", "Carpentry / Furniture", "WiFi & TV", "General"],
      default: "General",
    },
    issueDescription: { type: String, required: true },
    reportedBy: { type: String, default: "Housekeeping Staff" },
    assignedTo: { type: String, default: "Maintenance Team" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
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
