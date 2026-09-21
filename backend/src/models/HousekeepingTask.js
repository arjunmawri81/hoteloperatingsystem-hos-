const mongoose = require("mongoose");

const HousekeepingTaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    hotelId: {
      type: String,
      default: "",
    },
    orgId: {
      type: String,
      default: "",
    },
    roomType: {
      type: String,
      default: "",
    },
    floor: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["dirty", "cleaning", "inspection", "inspected", "clean", "out_of_order"],
      default: "dirty",
    },
    assignedTo: {
      type: String,
      default: "Unassigned",
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      default: "medium",
    },
    lastCleaned: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    checklist: [
      {
        item: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    inspection: {
      inspectedBy: { type: String, default: null },
      status: { type: String, enum: ["pending", "passed", "failed"], default: "pending" },
      remarks: { type: String, default: "" },
      inspectedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HousekeepingTask", HousekeepingTaskSchema);
