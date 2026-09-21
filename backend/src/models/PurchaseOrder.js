const mongoose = require("mongoose");

const POLineItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
});

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, required: true },
    department: {
      type: String,
      enum: ["Housekeeping", "Kitchen / F&B", "Front Desk", "Engineering / Maintenance"],
      default: "Housekeeping",
    },
    items: [POLineItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "received", "cancelled"],
      default: "draft",
    },
    approvedBy: { type: String, default: null },
    orderDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
    expectedDelivery: { type: String, default: "" },
    hotelId: { type: String, default: "hotel-101" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
