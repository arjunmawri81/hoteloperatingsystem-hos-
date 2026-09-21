const mongoose = require("mongoose");

const CashShiftSchema = new mongoose.Schema(
  {
    shiftId: {
      type: String,
      required: true,
      unique: true,
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
    cashierId: {
      type: String,
      default: "user-frontdesk",
    },
    cashierName: {
      type: String,
      required: true,
      default: "Front Desk Cashier",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    openingFloat: {
      type: Number,
      default: 0,
    },
    totalCashIn: {
      type: Number,
      default: 0,
    },
    totalCashOut: {
      type: Number,
      default: 0,
    },
    expectedCash: {
      type: Number,
      default: 0,
    },
    actualCashCounted: {
      type: Number,
      default: 0,
    },
    discrepancy: {
      type: Number,
      default: 0,
    },
    discrepancyReason: {
      type: String,
      default: "",
    },
    denominations: {
      note500: { type: Number, default: 0 },
      note200: { type: Number, default: 0 },
      note100: { type: Number, default: 0 },
      note50: { type: Number, default: 0 },
      note20: { type: Number, default: 0 },
      note10: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
    },
    handoverNotes: {
      type: String,
      default: "",
    },
    handoverTo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashShift", CashShiftSchema);
