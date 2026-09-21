const mongoose = require("mongoose");

const StockTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    hotelId: { type: String, required: true, default: "hotel-101" },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    type: {
      type: String,
      enum: ["purchase_receipt", "department_issue", "damage_writeoff", "loss", "expiry", "stock_transfer"],
      required: true,
    },
    quantity: { type: Number, required: true }, // positive for in, negative for out
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    department: { type: String, default: "General Store" },
    reason: { type: String, default: "" },
    performedBy: { type: String, default: "Inventory Manager" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransaction", StockTransactionSchema);
