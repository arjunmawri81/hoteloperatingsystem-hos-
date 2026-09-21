const mongoose = require("mongoose");

const ChannelMappingSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, default: "hotel-101" },
    provider: { type: String, required: true, default: "STAAH" },
    hosRoomType: { type: String, required: true }, // e.g., Deluxe Room
    channelRoomCode: { type: String, required: true }, // e.g., STAAH_DLX_01
    otaRoomName: { type: String, default: "Booking.com Deluxe King" },
    baseRate: { type: Number, default: 4500 },
    channelRateMultiplier: { type: Number, default: 1.0 }, // e.g., 1.15 (+15% markup)
    stopSell: { type: Boolean, default: false },
    minStay: { type: Number, default: 1 },
    maxStay: { type: Number, default: 30 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChannelMapping", ChannelMappingSchema);
