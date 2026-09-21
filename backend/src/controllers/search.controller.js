const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const Guest = require("../models/Guest");
const Invoice = require("../models/Invoice");
const Lead = require("../models/Lead");

exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          reservations: [],
          rooms: [],
          guests: [],
          invoices: [],
          leads: [],
        },
      });
    }

    const queryRegex = new RegExp(q.trim(), "i");

    const [reservations, rooms, guests, invoices, leads] = await Promise.all([
      Reservation.find({
        $or: [
          { id: queryRegex },
          { guestName: queryRegex },
          { guestPhone: queryRegex },
          { roomNumber: queryRegex },
        ],
      })
        .limit(5)
        .select("id guestName roomNumber roomType checkIn checkOut status totalAmount"),

      Room.find({
        $or: [{ number: queryRegex }, { type: queryRegex }, { status: queryRegex }],
      })
        .limit(5)
        .select("number type floor status rate guest"),

      Guest.find({
        $or: [{ name: queryRegex }, { phone: queryRegex }, { email: queryRegex }],
      })
        .limit(5)
        .select("id name phone email vipStatus bookingsCount"),

      Invoice.find({
        $or: [{ invoiceNumber: queryRegex }, { guestName: queryRegex }],
      })
        .limit(5)
        .select("invoiceNumber guestName roomNumber totalAmount status issueDate"),

      Lead.find({
        $or: [{ name: queryRegex }, { phone: queryRegex }, { source: queryRegex }],
      })
        .limit(5)
        .select("id name phone source status budget"),
    ]);

    return res.status(200).json({
      success: true,
      query: q,
      data: {
        reservations,
        rooms,
        guests,
        invoices,
        leads,
        totalMatches:
          reservations.length + rooms.length + guests.length + invoices.length + leads.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
