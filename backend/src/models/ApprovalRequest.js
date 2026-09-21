const mongoose = require("mongoose");

const ApprovalRequestSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, default: "hotel-101" },
    hotelName: { type: String, default: "Meridian Grand Plaza" },
    areaId: { type: String, default: "area-north" },
    type: {
      type: String,
      enum: ["discount", "refund", "purchase_order", "stock_adjustment", "maintenance"],
      required: true,
    },
    title: { type: String, required: true },
    details: { type: String, required: true },
    requestedBy: { type: String, required: true },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    decisionBy: { type: String, default: null },
    decisionNotes: { type: String, default: "" },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalRequest", ApprovalRequestSchema);
