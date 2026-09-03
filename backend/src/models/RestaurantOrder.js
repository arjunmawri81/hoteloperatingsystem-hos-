const mongoose = require("mongoose");

const RestaurantOrderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    tableNumber: {
      type: String,
      default: "T-01",
    },
    roomNumber: {
      type: String,
    },
    items: [
      {
        type: String,
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["cooking", "served", "paid", "charged_to_room"],
      default: "cooking",
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RestaurantOrder", RestaurantOrderSchema);
