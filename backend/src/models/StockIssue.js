const mongoose = require("mongoose");

const StockIssueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: true,
      unique: true,
    },
    hotelId: {
      type: String,
      default: "hotel-101",
    },
    department: {
      type: String,
      enum: ["Housekeeping", "Kitchen & F&B", "Front Desk & Maintenance"],
      required: true,
    },
    issuedToStaff: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      default: "Daily departmental replenishment",
    },
    items: [
      {
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: "Units" },
      },
    ],
    issuedBy: {
      type: String,
      default: "Store Keeper",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockIssue", StockIssueSchema);
