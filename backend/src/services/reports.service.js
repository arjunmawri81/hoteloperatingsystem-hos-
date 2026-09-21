const Room = require("../models/Room");
const Reservation = require("../models/Reservation");
const RestaurantOrder = require("../models/RestaurantOrder");
const EventBooking = require("../models/EventBooking");
const Lead = require("../models/Lead");

class ReportsService {
  /**
   * Compute Real-time Executive Performance KPIs
   */
  static async getExecutiveKPIs(hotelId) {
    let baseFilter = {};
    if (hotelId && hotelId !== "hotel-101") {
      const matchCount = await Room.countDocuments({ hotelId });
      if (matchCount > 0) baseFilter = { hotelId };
    }

    const totalRooms = await Room.countDocuments(baseFilter);
    const occupiedRooms = await Room.countDocuments({ ...baseFilter, status: "occupied" });
    const availableRooms = await Room.countDocuments({ ...baseFilter, status: "available" });
    const dirtyRooms = await Room.countDocuments({ ...baseFilter, status: { $in: ["dirty", "cleaning"] } });
    const maintenanceRooms = await Room.countDocuments({ ...baseFilter, status: { $in: ["out_of_order", "maintenance"] } });

    // Room Revenue from active/checked-in/confirmed reservations
    const reservations = await Reservation.find({ status: { $ne: "cancelled" } });
    const roomRevenue = reservations.reduce((acc, r) => acc + (r.paidAmount || 0), 0);

    // Restaurant Revenue
    const orders = await RestaurantOrder.find({ status: { $ne: "cancelled" } });
    const restaurantRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

    // Banquet Revenue
    const banquets = await EventBooking.find({ status: { $ne: "cancelled" } });
    const banquetRevenue = banquets.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const totalGrossRevenue = roomRevenue + restaurantRevenue + banquetRevenue;

    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    const adr = occupiedRooms > 0 ? Math.round(roomRevenue / occupiedRooms) : 0;
    const revPar = totalRooms > 0 ? Math.round(roomRevenue / totalRooms) : 0;

    // Leads & Conversion
    const totalLeads = await Lead.countDocuments();
    const convertedLeads = await Lead.countDocuments({ status: "Converted" });
    const leadConversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    return {
      kpis: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        dirtyRooms,
        maintenanceRooms,
        occupancyRate: `${occupancyRate}%`,
        adr: `₹${adr.toLocaleString()}`,
        revPar: `₹${revPar.toLocaleString()}`,
        totalRevenue: `₹${totalGrossRevenue.toLocaleString()}`,
        leadConversionRate: `${leadConversionRate}%`,
      },
      departmentRevenue: {
        rooms: roomRevenue,
        restaurant: restaurantRevenue,
        banquet: banquetRevenue,
        total: totalGrossRevenue,
      },
    };
  }

  /**
   * Export reservations to CSV format
   */
  static async exportReservationsCSV() {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    let csv = "Booking ID,Guest Name,Phone,Room Number,Room Type,Check-In,Check-Out,Status,Total Amount,Paid Amount\n";
    
    reservations.forEach((r) => {
      csv += `"${r.id}","${r.guestName}","${r.guestPhone || ""}","${r.roomNumber || ""}","${r.roomType || ""}","${r.checkIn}","${r.checkOut}","${r.status}",${r.totalAmount},${r.paidAmount}\n`;
    });

    return csv;
  }
}

module.exports = ReportsService;
