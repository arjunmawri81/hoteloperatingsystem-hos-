const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    orgId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      default: "General",
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
    occupiedRooms: {
      type: Number,
      default: 0,
    },
    occupancyRate: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    managerName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "maintenance", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hotel", HotelSchema);
