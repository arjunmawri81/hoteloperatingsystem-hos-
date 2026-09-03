const mongoose = require("mongoose");

const GuestSchema = new mongoose.Schema(
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
    email: {
      type: String,
      trim: true,
      default: "guest@example.com",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    stays: {
      type: Number,
      default: 1,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    segment: {
      type: String,
      enum: ["VIP", "Corporate", "Repeat", "New"],
      default: "New",
    },
    preferences: {
      type: String,
      default: "Standard preferences",
    },
    notes: {
      type: String,
      default: "Profile registered in system",
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

module.exports = mongoose.model("Guest", GuestSchema);
