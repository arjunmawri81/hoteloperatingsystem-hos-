const mongoose = require("mongoose");

const RatePlanSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    hotelId: {
      type: String,
      default: "hot-1",
    },
    code: {
      type: String,
      required: true, // e.g. "EP", "CP", "CORP", "WKND"
    },
    name: {
      type: String,
      required: true, // e.g. "European Plan (Room Only)", "Continental Plan (With Breakfast)"
    },
    description: {
      type: String,
      default: "",
    },
    inclusions: [
      {
        type: String, // e.g. "Complimentary Breakfast", "Free High-Speed WiFi", "Late Checkout 1 PM"
      },
    ],
    priceMultiplier: {
      type: Number,
      default: 1.0, // Multiplier on base room price (e.g. 1.15 for CP)
    },
    fixedExtraCharge: {
      type: Number,
      default: 0,
    },
    minNights: {
      type: Number,
      default: 1,
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation up to 24 hours before check-in. 100% fee thereafter.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RatePlan", RatePlanSchema);
