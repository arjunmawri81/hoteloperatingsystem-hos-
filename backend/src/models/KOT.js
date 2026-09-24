const mongoose = require("mongoose");

const KOTItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  portion: { type: String, default: "Full" }, // e.g. "Full", "Half", "Quarter", "Standard"
  quantity: { type: Number, required: true, default: 1 },
  instructions: { type: String, default: "" }, // e.g. "Less spicy, no peanuts"
});

const KOTSchema = new mongoose.Schema(
  {
    kotNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    tableNumber: { type: String, default: "Table 1" },
    roomNumber: { type: String, default: null }, // If room service
    serverName: { type: String, default: "Captain" },
    items: [KOTItemSchema],
    status: {
      type: String,
      enum: ["new", "preparing", "ready", "served", "completed", "cancelled"],
      default: "new",
    },
    hotelId: { type: String, default: "hotel-101" },
    orgId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KOT", KOTSchema);
