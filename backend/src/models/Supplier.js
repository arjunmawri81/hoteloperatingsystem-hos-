const mongoose = require("mongoose");

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    paymentTerms: { type: String, default: "Net 30 Days" },
    category: {
      type: String,
      enum: ["Food & Beverage", "Housekeeping Linen & Toiletries", "Engineering & Maintenance", "Stationery & Admin", "Cutlery & Crockery"],
      default: "Housekeeping Linen & Toiletries",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    hotelId: { type: String, default: "hotel-101" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", SupplierSchema);
