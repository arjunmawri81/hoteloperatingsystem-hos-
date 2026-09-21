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
    images: {
      front: { type: String, default: "" },
      lobby: { type: String, default: "" },
      room: { type: String, default: "" },
      washroom: { type: String, default: "" },
    },
    legalKyc: {
      gstin: { type: String, default: "" },
      tradeLicense: { type: String, default: "" },
      fireSafetyNoc: { type: String, default: "" },
    },
    locationDetails: {
      address: { type: String, default: "" },
      landmark: { type: String, default: "" },
      pincode: { type: String, default: "" },
      mapUrl: { type: String, default: "" },
    },
    policies: {
      checkInTime: { type: String, default: "12:00 PM" },
      checkOutTime: { type: String, default: "11:00 AM" },
      category: { type: String, default: "3-Star Hotel" },
      amenities: { type: [String], default: [] },
    },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending_review", "rejected"],
      default: "verified",
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
