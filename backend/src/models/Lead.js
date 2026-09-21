const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "lead@client.com",
      trim: true,
    },
    source: {
      type: String,
      enum: ["Website", "WhatsApp", "AI Phone Call", "Social", "Direct Enquiry", "OTA", "Channel Manager"],
      default: "Website",
    },
    requirement: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    stage: {
      type: String,
      enum: ["New", "Contacted", "AI Qualified", "Proposal", "Converted", "Lost"],
      default: "New",
    },
    aiSummary: {
      type: String,
      default: "Inquiry recorded in sales CRM.",
    },
    nextFollowUp: {
      type: String,
      default: "Tomorrow, 10:00 AM",
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

module.exports = mongoose.model("Lead", LeadSchema);
