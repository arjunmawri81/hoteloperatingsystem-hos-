const mongoose = require("mongoose");

const InventoryItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Linen & Bedding", "Guest Amenities", "Cleaning Supplies", "Food & Beverage", "Maintenance"],
      default: "Guest Amenities",
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      default: 10,
      min: 0,
    },
    unit: {
      type: String,
      default: "Units",
    },
    unitPrice: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Critical"],
      default: "In Stock",
    },
    supplier: {
      type: String,
      default: "General Supplier",
    },
    hotelId: {
      type: String,
      default: "hotel-101",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InventoryItem", InventoryItemSchema);
