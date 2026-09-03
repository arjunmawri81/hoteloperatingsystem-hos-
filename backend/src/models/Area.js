const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      default: "General Region",
    },
    manager: {
      type: String,
      required: true,
    },
    hotelsCount: {
      type: Number,
      default: 1,
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
    occupancy: {
      type: String,
      default: "0%",
    },
    revenue: {
      type: String,
      default: "$0",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    orgId: {
      type: String,
      default: "org-1",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Area", AreaSchema);
