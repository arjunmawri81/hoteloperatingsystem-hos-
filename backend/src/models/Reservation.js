const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      default: "",
    },
    guestPhone: {
      type: String,
      default: "",
    },
    hotelName: {
      type: String,
      default: "",
    },
    roomNumber: {
      type: String,
      default: "TBD",
    },
    roomType: {
      type: String,
      default: "",
    },
    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled"],
      default: "confirmed",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: "Web Direct",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reservation", ReservationSchema);
