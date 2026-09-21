const mongoose = require("mongoose");

const PurchaseInwardSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    hotelId: {
      type: String,
      default: "hotel-101",
    },
    vendorName: {
      type: String,
      required: true,
    },
    vendorGstin: {
      type: String,
      default: "",
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      enum: ["Housekeeping", "Kitchen & F&B", "Front Desk & Maintenance", "General"],
      default: "Housekeeping",
    },
    items: [
      {
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 18 },
        totalAmount: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    receivedBy: {
      type: String,
      default: "Store Manager",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseInward", PurchaseInwardSchema);
