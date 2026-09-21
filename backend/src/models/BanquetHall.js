const mongoose = require("mongoose");

const BanquetHallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    capacity: { type: Number, required: true, default: 100 },
    layout: {
      type: String,
      enum: ["Theater", "Round Table", "Classroom", "U-Shape", "Hollow Square"],
      default: "Round Table",
    },
    basePricePerDay: { type: Number, required: true, default: 25000 },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    },
    areaSqFt: { type: Number, default: 3500 },
    dimension: { type: String, default: "70ft x 50ft" },
    facilities: [{ type: String }],
    status: {
      type: String,
      enum: ["available", "booked", "maintenance"],
      default: "available",
    },
    hotelId: { type: String, default: "hotel-101" },
    hotelName: { type: String, default: "Meridian Grand Plaza" },
    orgId: { type: String, default: "org-1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BanquetHall", BanquetHallSchema);
