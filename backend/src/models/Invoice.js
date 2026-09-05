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
    orgId: {
      type: String,
      default: "org-1",
    },
    billedBy: {
      type: String,
      default: "Front Desk Staff",
    },
    billedByRole: {
      type: String,
      default: "receptionist",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
