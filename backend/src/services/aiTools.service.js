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
  static async searchKnowledgeBase(query, hotelId) {
    const filter = { isActive: true };
    if (hotelId) {
      filter.$or = [{ hotelId }, { hotelId: "hotel-101" }, { hotelId: "global" }, { hotelId: { $exists: false } }];
    }

    const items = await AIKnowledge.find(filter);
    if (!items || items.length === 0) return null;

    const STOP_WORDS = new Set([
      "what", "is", "the", "are", "and", "for", "you", "your", "our", "with",
      "this", "that", "how", "can", "have", "any", "from", "does", "hai", "kya", "me", "ko", "timing", "hours"
    ]);

    const lower = (query || "").toLowerCase();
    const queryWords = lower
      .replace(/[^\w\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    let bestMatch = null;
    let highestScore = 0;

    for (const item of items) {
      let score = 0;
      const qLower = item.question.toLowerCase();

      // Strong match on question substring
      if (lower.includes(qLower) || qLower.includes(lower)) {
        score += 10;
      }

      // Check keywords
      if (Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          const kLower = kw.toLowerCase();
          if (STOP_WORDS.has(kLower)) continue;

          // Strong boost for specific subject keywords
          if (lower.includes(kLower)) {
            if (["wifi", "breakfast", "pool", "cancel", "cancellation", "check-in", "checkout", "check-out", "gym"].includes(kLower)) {
              score += 5;
            } else {
              score += 2;
            }
          }
        }
      }

      // Meaningful content word overlap
      const qWords = qLower
        .replace(/[^\w\s-]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      const overlap = queryWords.filter((w) => qWords.includes(w));
      score += overlap.length * 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    // Require a meaningful score threshold
    if (highestScore >= 4 && bestMatch) {
      return bestMatch.answer;
    }

    return null;
  }
}

module.exports = AIToolsService;
