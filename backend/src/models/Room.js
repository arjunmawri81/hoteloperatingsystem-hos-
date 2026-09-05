const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      default: "Standard Room",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "dirty", "out_of_order"],
      default: "available",
    },
    guest: {
      type: String,
      default: null,
    },
    cleaner: {
      type: String,
      default: null,
    },
    rate: {
      type: Number,
      default: 2500,
    },
    hotelId: {
      type: String,
      default: "hotel-101",
    },
    hotelName: {
      type: String,
      default: "",
    },
    orgId: {
      type: String,
      default: "org-1",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", RoomSchema);
