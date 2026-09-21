const mongoose = require("mongoose");

const RestaurantTableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true },
    section: {
      type: String,
      enum: ["Main Dining Hall", "Terrace Garden", "Poolside Deck", "Private Dining (PDR)", "Lounge Bar"],
      default: "Main Dining Hall",
    },
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
    currentOrderId: { type: String, default: null },
    currentGuestName: { type: String, default: null },
    roomNumber: { type: String, default: null },
    hotelId: { type: String, default: "hotel-101" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantTable", RestaurantTableSchema);
