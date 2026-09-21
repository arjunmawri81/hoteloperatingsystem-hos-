const Room = require("../models/Room");
const Reservation = require("../models/Reservation");
const AIKnowledge = require("../models/AIKnowledge");

class AIToolsService {
  /**
   * Tool 1: Live room availability & pricing lookup
   */
  static async checkAvailability({ hotelId = "hotel-101", roomType, guests = 2 }) {
    const filter = { hotelId, status: "available" };
    if (roomType) {
      filter.type = new RegExp(roomType, "i");
    }

    const availableRooms = await Room.find(filter);
    const uniqueTypes = {};

    availableRooms.forEach((r) => {
      if (!uniqueTypes[r.type]) {
        uniqueTypes[r.type] = {
          type: r.type,
          count: 0,
          rate: r.rate,
          amenities: ["Free High-speed WiFi", "Air Conditioning", "Complimentary Breakfast", "Smart TV"],
        };
      }
      uniqueTypes[r.type].count++;
    });

    return {
      totalAvailable: availableRooms.length,
      roomTypes: Object.values(uniqueTypes),
    };
  }

  /**
   * Tool 2: Lookup an existing reservation
   */
  static async lookupBooking({ bookingId, guestPhone }) {
    const query = {};
    if (bookingId) query.id = bookingId.trim();
    if (guestPhone) query.guestPhone = guestPhone.trim();

    if (!query.id && !query.guestPhone) {
      return { found: false, message: "Please provide a Booking ID or Phone Number." };
    }

    const booking = await Reservation.findOne(query);
    if (!booking) {
      return { found: false, message: "No matching reservation found in our system." };
    }

    return {
      found: true,
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        hotelName: booking.hotelName,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
      },
    };
  }

  /**
   * Tool 3: Search Hotel Knowledge Base
   */
  static async searchKnowledgeBase(query, hotelId = "hotel-101") {
    const items = await AIKnowledge.find({ hotelId, isActive: true });
    if (!items || items.length === 0) return null;

    const lower = query.toLowerCase();
    const match = items.find(
      (item) =>
        lower.includes(item.question.toLowerCase()) ||
        item.keywords.some((k) => lower.includes(k.toLowerCase()))
    );

    return match ? match.answer : null;
  }
}

module.exports = AIToolsService;
