const mongoose = require("mongoose");

const AIKnowledgeSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, default: "hotel-101" },
    category: {
      type: String,
      enum: ["Check-in / Check-out", "Amenities & Facilities", "Restaurant & Dining", "Policies & Rules", "Local Attractions", "Pricing & Offers"],
      default: "Amenities & Facilities",
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    keywords: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIKnowledge", AIKnowledgeSchema);
