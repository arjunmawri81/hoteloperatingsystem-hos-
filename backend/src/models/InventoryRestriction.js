const mongoose = require("mongoose");

const InventoryRestrictionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: String,
      default: "hot-1",
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    roomType: {
      type: String, // e.g. "Deluxe Suite", "Executive", or "ALL"
      required: true,
    },
    stopSell: {
      type: Boolean,
      default: false,
    },
    minStay: {
      type: Number,
      default: 1,
    },
    maxStay: {
      type: Number,
      default: 30,
    },
    rateAdjustment: {
      type: Number,
      default: 0, // Override base price on this date (e.g. +₹1000 for peak/holiday)
    },
    reason: {
      type: String,
      default: "Standard restriction",
    },
    updatedBy: {
      type: String,
      default: "Revenue Manager",
    },
  },
  {
    timestamps: true,
  }
);

InventoryRestrictionSchema.index({ hotelId: 1, date: 1, roomType: 1 }, { unique: true });

module.exports = mongoose.model("InventoryRestriction", InventoryRestrictionSchema);
