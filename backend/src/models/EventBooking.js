const mongoose = require("mongoose");

const EventBookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "BanquetHall" },
    hallName: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["Wedding", "Corporate Conference", "Birthday / Anniversary", "Exhibition", "Cocktail Dinner"],
      default: "Corporate Conference",
    },
    eventDate: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, default: "10:00 AM" },
    endTime: { type: String, default: "06:00 PM" },
    guestCount: { type: Number, required: true, default: 50 },
    packageName: { type: String, default: "Executive Delegate Package" },
    packageDetails: {
      food: { type: String, default: "Buffet Lunch & High Tea" },
      decoration: { type: String, default: "Standard Floral & Stage" },
      equipment: [{ type: String }],
    },
    totalAmount: { type: Number, required: true, default: 0 },
    advancePaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["tentative", "confirmed", "completed", "cancelled"],
      default: "confirmed",
    },
    hotelId: { type: String, default: "hotel-101" },
    orgId: { type: String, default: "org-1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventBooking", EventBookingSchema);
