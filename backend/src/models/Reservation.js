const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      default: "",
    },
    guestPhone: {
      type: String,
      default: "",
    },
    idType: {
      type: String,
      default: "Aadhaar",
    },
    idNumber: {
      type: String,
      default: "",
    },
    idDocUrl: {
      type: String,
      default: "",
    },
    isPreCheckedIn: {
      type: Boolean,
      default: false,
    },
    webCheckInToken: {
      type: String,
      index: true,
      default: null,
    },
    webCheckInExpiresAt: {
      type: Date,
      default: null,
    },
    webCheckInStatus: {
      type: String,
      default: "not_sent",
    },
    signatureUrl: {
      type: String,
      default: "",
    },
    coGuests: [
      {
        name: { type: String, default: "" },
        age: { type: Number, default: 0 },
        idType: { type: String, default: "Aadhaar" },
        idNumber: { type: String, default: "" },
      },
    ],
    paymentPreference: {
      type: String,
      default: "pay_at_counter",
    },
    estimatedArrivalTime: {
      type: String,
      default: "",
    },
    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    specialRequests: {
      type: String,
      default: "",
    },
    orgId: {
      type: String,
      default: "",
    },
    hotelName: {
      type: String,
      default: "Meridian Grand Plaza",
    },
    hotelId: {
      type: String,
      default: "hot-1",
    },
    roomNumber: {
      type: String,
      default: "TBD",
    },
    roomType: {
      type: String,
      default: "Deluxe Suite",
    },
    ratePlan: {
      type: String,
      default: "EP - Room Only",
    },
    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    actualCheckIn: {
      type: Date,
      default: null,
    },
    actualCheckOut: {
      type: Date,
      default: null,
    },
    earlyCheckInFee: {
      type: Number,
      default: 0,
    },
    lateCheckOutFee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
    },
    groupBookingId: {
      type: String,
      default: null,
    },
    folioCharges: [
      {
        id: { type: String, default: () => `CHG-${Date.now()}-${Math.floor(Math.random()*1000)}` },
        description: { type: String, required: true },
        department: { type: String, default: "Room" }, // Room, Restaurant, Banquet, Laundry, Minibar, Services
        amount: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        refId: { type: String, default: null }, // e.g. Restaurant Order ID
      },
    ],
    payments: [
      {
        id: { type: String, default: () => `PAY-${Date.now()}-${Math.floor(Math.random()*1000)}` },
        amount: { type: Number, required: true },
        method: { type: String, default: "Cash" }, // Cash, Credit Card, UPI, Net Banking
        transactionId: { type: String, default: "" },
        date: { type: Date, default: Date.now },
        status: { type: String, default: "captured" },
        note: { type: String, default: "" },
      },
    ],
    roomChanges: [
      {
        fromRoom: { type: String },
        toRoom: { type: String },
        reason: { type: String },
        date: { type: Date, default: Date.now },
        changedBy: { type: String, default: "Staff" },
      },
    ],
    cancellationReason: {
      type: String,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: "Web Direct",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reservation", ReservationSchema);
