const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guest: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },
    date: {
      type: String,
      required: true,
    },
    hotelId: {
      type: String,
      default: "hotel-101",
    },
    hotelName: {
      type: String,
      default: "Meridian Grand Palace",
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Cash", "UPI / Digital", "Bank Transfer", "Room Charge", "Pending"],
      default: "Pending",
    },
    transactionRef: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
