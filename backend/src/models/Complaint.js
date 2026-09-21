const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    guestName: { type: String, required: true },
    roomNumber: { type: String, default: "" },
    hotelId: { type: String, required: true, default: "hotel-101" },
    department: {
      type: String,
      enum: ["Front Desk", "Housekeeping", "Room Service / F&B", "Maintenance", "Billing"],
      default: "Front Desk",
    },
    category: { type: String, default: "Service Delay" },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "closed"],
      default: "open",
    },
    assignedStaff: { type: String, default: "Duty Manager" },
    resolutionNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", ComplaintSchema);
