const mongoose = require("mongoose");

const CashTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    shiftId: {
      type: String,
      required: true,
      index: true,
    },
    hotelId: {
      type: String,
      default: "",
    },
    hotelName: {
      type: String,
      default: "",
    },
    orgId: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["cash_in", "cash_out"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "room_payment",
        "restaurant_pos",
        "petty_cash_expense",
        "advance_deposit",
        "vendor_payout",
        "opening_float",
        "other",
      ],
      default: "other",
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    voucherNumber: {
      type: String,
      default: "",
    },
    referenceId: {
      type: String,
      default: "", // e.g. Reservation ID, Table Order ID
    },
    recordedBy: {
      type: String,
      default: "Front Desk Cashier",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashTransaction", CashTransactionSchema);
