const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    ownerName: {
      type: String,
      default: "",
    },
    ownerEmail: {
      type: String,
      default: "",
    },
    hotelsCount: {
      type: Number,
      default: 0,
    },
    activeRooms: {
      type: Number,
      default: 0,
    },
    monthlyRevenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "trial", "suspended"],
      default: "active",
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
