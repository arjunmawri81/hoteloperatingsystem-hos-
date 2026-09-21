const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
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
    building: {
      type: String,
      default: "Main Wing",
    },
    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "reserved",
        "dirty",
        "cleaning",
        "clean",
        "inspected",
        "out_of_order",
        "maintenance",
      ],
      default: "available",
    },
    lastInspectedBy: {
      type: String,
      default: null,
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

RoomSchema.index({ hotelId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Room", RoomSchema);
