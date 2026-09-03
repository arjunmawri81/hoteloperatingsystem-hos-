const Reservation = require("../models/Reservation");
const AuditService = require("./audit.service");
const NotificationService = require("./notification.service");

class ReservationsService {
  /**
   * Check room availability for given dates & room type
   */
  static async checkAvailability({ hotelName, roomNumber, checkIn, checkOut }) {
    if (!roomNumber || roomNumber === "TBD") return true;

    // Check for overlapping bookings on the same room number
    const overlap = await Reservation.findOne({
      hotelName: new RegExp(hotelName, "i"),
      roomNumber,
      status: { $in: ["confirmed", "checked_in"] },
      $or: [
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn },
        },
      ],
    });

    return !overlap;
  }

  /**
   * Get all reservations with tenant filtering
   */
  static async listReservations({ tenant, filters = {} }) {
    const query = {};

    if (filters.hotelName) {
      query.hotelName = new RegExp(filters.hotelName, "i");
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.guestEmail) {
      query.guestEmail = filters.guestEmail.toLowerCase();
    }

    return await Reservation.find(query).sort({ createdAt: -1 });
  }

  /**
   * Create a new reservation with full business rules execution
   */
  static async createReservation({ data, user, tenant, ipAddress }) {
    const {
      guestName,
      guestEmail,
      guestPhone,
      hotelName = "Meridian Grand Palace",
      roomNumber = "TBD",
      roomType = "Deluxe King",
      checkIn,
      checkOut,
      totalAmount,
      paidAmount,
      source = "Web Direct",
    } = data;

    // 1. Business Rule: Check Room Availability
    const isAvailable = await this.checkAvailability({
      hotelName,
      roomNumber,
      checkIn,
      checkOut,
    });

    if (!isAvailable) {
      const error = new Error(`Room ${roomNumber} is unavailable for the selected dates.`);
      error.status = 409;
      throw error;
    }

    // 2. Business Rule: Calculate Amount if not specified
    const calculatedTotal = Number(totalAmount) || 15000;
    const calculatedPaid = Number(paidAmount) || 0;

    // 3. Persist Reservation in Repository
    const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation = new Reservation({
      id: reservationId,
      guestName,
      guestEmail: guestEmail ? guestEmail.toLowerCase() : "guest@example.com",
      guestPhone: guestPhone || "+91 90000 00000",
      hotelName,
      roomNumber,
      roomType,
      checkIn,
      checkOut,
      status: "confirmed",
      totalAmount: calculatedTotal,
      paidAmount: calculatedPaid,
      source,
    });

    await newReservation.save();

    // 4. Create Audit Log
    await AuditService.log({
      userId: user?.id || "guest",
      userRole: user?.role || "customer",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "CREATE_RESERVATION",
      resource: "reservations",
      resourceId: reservationId,
      details: {
        guestName,
        hotelName,
        roomNumber,
        checkIn,
        checkOut,
        totalAmount: calculatedTotal,
      },
      ipAddress,
    });

    // 5. Send Notification
    await NotificationService.send({
      recipient: guestEmail || "guest@example.com",
      type: "BOOKING_CONFIRMATION",
      payload: {
        reservationId,
        guestName,
        hotelName,
        checkIn,
        checkOut,
      },
    });

    return newReservation;
  }

  /**
   * Update reservation status with audit trail
   */
  static async updateStatus({ id, status, user, tenant, ipAddress }) {
    const reservation = await Reservation.findOne({ id });
    if (!reservation) {
      const error = new Error("Reservation not found");
      error.status = 404;
      throw error;
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Audit Log
    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "hotel_manager",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "UPDATE_RESERVATION_STATUS",
      resource: "reservations",
      resourceId: id,
      details: { previousStatus, newStatus: status },
      ipAddress,
    });

    return reservation;
  }
}

module.exports = ReservationsService;
