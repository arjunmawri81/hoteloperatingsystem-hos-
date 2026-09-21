const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Starters", "Main Course", "Breads & Rice", "Desserts", "Beverages"],
      default: "Main Course",
    },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 15 },
    hotelId: { type: String, default: "hotel-101" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", MenuItemSchema);
