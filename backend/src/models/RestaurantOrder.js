const mongoose = require("mongoose");

const RestaurantOrderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    orgId: {
      type: String,
      default: "",
    },
    hotelId: {
      type: String,
      default: "",
    },
    hotelName: {
      type: String,
      default: "",
    },
    guestName: {
      type: String,
      default: "",
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
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["cooking", "preparing", "ready", "served", "paid", "billed", "charged_to_room", "cancelled"],
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
