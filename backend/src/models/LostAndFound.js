const mongoose = require("mongoose");

const LostAndFoundSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    hotelId: { type: String, required: true, default: "hotel-101" },
    roomNumber: { type: String, required: true },
    itemName: { type: String, required: true },
    category: {
      type: String,
      enum: ["Electronics & Chargers", "Jewelry & Valuables", "Clothing / Shoes", "Documents / Wallets", "Luggage & Bags", "Other"],
      default: "Other",
    },
    description: { type: String, default: "" },
    foundBy: { type: String, default: "Housekeeper" },
    foundDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
    storageLocation: { type: String, default: "Security Locker A-1" },
    status: {
      type: String,
      enum: ["found", "claimed", "disposed", "unclaimed"],
      default: "found",
    },
    claimedByGuest: { type: String, default: "" },
    claimedContact: { type: String, default: "" },
    claimedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostAndFound", LostAndFoundSchema);
