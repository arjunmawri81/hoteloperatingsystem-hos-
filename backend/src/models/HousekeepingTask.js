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
      enum: ["dirty", "cleaning", "inspected", "clean", "out_of_order"],
      default: "dirty",
    },
    assignedTo: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    lastCleaned: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HousekeepingTask", HousekeepingTaskSchema);
