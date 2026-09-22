const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const BanquetHall = require("../models/BanquetHall");
const EventBooking = require("../models/EventBooking");
const RestaurantTable = require("../models/RestaurantTable");
const ChannelManager = require("../models/ChannelManager");
const ChannelMapping = require("../models/ChannelMapping");
const Supplier = require("../models/Supplier");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const LostAndFound = require("../models/LostAndFound");
const ApprovalRequest = require("../models/ApprovalRequest");
const AIKnowledge = require("../models/AIKnowledge");
const Complaint = require("../models/Complaint");
const { mockUsers, mockOrganizations, mockHotels } = require("./mockData");

const seedDatabase = async () => {
  try {
    // 1. Seed Organizations
    const orgCount = await Organization.countDocuments();
    if (orgCount === 0 && mockOrganizations && mockOrganizations.length > 0) {
      await Organization.insertMany(mockOrganizations);
      console.log(`✅ Seeded ${mockOrganizations.length} organizations.`);
    }

    // 2. Seed Hotels
    if (mockHotels && mockHotels.length > 0) {
      const hotelCount = await Hotel.countDocuments();
      if (hotelCount === 0) {
        await Hotel.insertMany(mockHotels);
        console.log(`✅ Seeded ${mockHotels.length} hotels.`);
      }
    }

    // 3. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0 && mockUsers && mockUsers.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      const usersToInsert = mockUsers.map((user) => ({
        ...user,
        passwordHash: hashedPassword,
      }));

      await User.insertMany(usersToInsert);
      console.log(`✅ Seeded ${usersToInsert.length} initial users (default password: admin123).`);
    }

    // 4. Seed Banquet Halls & Event Bookings
    const hallCount = await BanquetHall.countDocuments();
    if (hallCount === 0) {
      const halls = await BanquetHall.insertMany([
        {
          name: "Grand Kohinoor Ballroom",
          code: "HALL-01",
          capacity: 450,
          layout: "Round Table",
          basePricePerDay: 85000,
          facilities: ["Stage Lighting", "Dolby Atmos Audio", "Projector 4K", "Bridal Suite", "Bar Counter"],
          status: "available",
        },
        {
          name: "Senate Boardroom & Terrace",
          code: "HALL-02",
          capacity: 80,
          layout: "Theater",
          basePricePerDay: 35000,
          facilities: ["Video Conferencing", "Smartboard", "High-speed WiFi", "Private Buffet Zone"],
          status: "available",
        },
      ]);

      await EventBooking.create({
        bookingId: "EVT-1001",
        customerName: "Tata Consultancy Services (TCS)",
        customerPhone: "+91 98201 12345",
        customerEmail: "events@tcs.com",
        hallId: halls[0]._id,
        hallName: halls[0].name,
        eventType: "Corporate Conference",
        eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        startTime: "09:00 AM",
        endTime: "06:00 PM",
        guestCount: 220,
        packageName: "Executive Full-Day Conference Package",
        totalAmount: 145000,
        advancePaid: 50000,
        balanceDue: 95000,
        status: "confirmed",
      });
      console.log("✅ Seeded initial Banquet Halls & Bookings.");
    }

    // 5. Seed Restaurant Tables
    const tableCount = await RestaurantTable.countDocuments();
    if (tableCount === 0) {
      await RestaurantTable.insertMany([
        { tableNumber: "T-01", section: "Main Dining Hall", capacity: 4, status: "available" },
        { tableNumber: "T-02", section: "Main Dining Hall", capacity: 2, status: "occupied", currentGuestName: "Rahul Sharma", roomNumber: "201" },
        { tableNumber: "T-03", section: "Terrace Garden", capacity: 6, status: "available" },
        { tableNumber: "T-04", section: "Terrace Garden", capacity: 4, status: "reserved", currentGuestName: "Priya Nair" },
        { tableNumber: "T-05", section: "Lounge Bar", capacity: 2, status: "available" },
        { tableNumber: "PDR-01", section: "Private Dining (PDR)", capacity: 12, status: "available" },
      ]);
      console.log("✅ Seeded Restaurant Tables.");
    }

    // 6. Seed Channel Manager & Mappings
    const chanCount = await ChannelManager.countDocuments();
    if (chanCount === 0) {
      await ChannelManager.create({
        provider: "STAAH",
        hotelId: "hotel-101",
        hotelCode: "STAAH-MER-5402",
        status: "connected",
        twoWaySyncEnabled: true,
      });

      await ChannelMapping.insertMany([
        {
          provider: "STAAH",
          hosRoomType: "Deluxe Room",
          channelRoomCode: "STAAH_DLX_01",
          otaRoomName: "Booking.com Deluxe King",
          baseRate: 4500,
          channelRateMultiplier: 1.15,
          stopSell: false,
          minStay: 1,
        },
        {
          provider: "STAAH",
          hosRoomType: "Presidential Suite",
          channelRoomCode: "STAAH_SUI_99",
          otaRoomName: "Expedia Presidential Suite",
          baseRate: 12000,
          channelRateMultiplier: 1.2,
          stopSell: false,
          minStay: 2,
        },
      ]);
      console.log("✅ Seeded Channel Manager configuration & OTA mappings.");
    }

    // 7. Seed Suppliers
    const supCount = await Supplier.countDocuments();
    if (supCount === 0) {
      await Supplier.insertMany([
        {
          name: "Apex Linen & Towel Mills",
          code: "SUP-LINEN",
          contactPerson: "Vikram Malhotra",
          email: "sales@apexlinen.in",
          phone: "+91 98210 55432",
          category: "Housekeeping Linen & Toiletries",
        },
        {
          name: "FarmFresh Organic Dairy & Produce",
          code: "SUP-FOOD",
          contactPerson: "Anita Deshmukh",
          email: "orders@farmfresh.com",
          phone: "+91 98111 88776",
          category: "Food & Beverage",
        },
      ]);
      console.log("✅ Seeded Suppliers.");
    }

    // 8. Seed Maintenance Tickets & Lost and Found
    const mntCount = await MaintenanceRequest.countDocuments();
    if (mntCount === 0) {
      await MaintenanceRequest.create({
        ticketId: "MNT-2001",
        roomNumber: "304",
        category: "Air Conditioning (HVAC)",
        issueDescription: "AC thermostat not cooling below 26°C and vibrating noisily.",
        reportedBy: "Sita Verma (Housekeeping)",
        assignedTo: "Rajesh (HVAC Lead)",
        priority: "high",
        status: "in_progress",
      });
      console.log("✅ Seeded Maintenance tickets.");
    }

    const lfCount = await LostAndFound.countDocuments();
    if (lfCount === 0) {
      await LostAndFound.create({
        itemId: "LF-5001",
        roomNumber: "201",
        itemName: "Apple iPad Pro (Space Grey)",
        category: "Electronics & Chargers",
        description: "Found on nightstand inside leather case.",
        foundBy: "Sita Verma",
        storageLocation: "Duty Manager Safe #2",
        status: "found",
      });
      console.log("✅ Seeded Lost & Found registry.");
    }

    // 9. Seed Area Manager Approval Requests
    const appCount = await ApprovalRequest.countDocuments();
    if (appCount === 0) {
      await ApprovalRequest.insertMany([
        {
          hotelId: "hotel-101",
          hotelName: "Meridian Grand Plaza",
          type: "discount",
          title: "Discount Request — 18% Corporate Rate for Infosys Delegation",
          details: "Front Desk requests 18% concession on 8 Deluxe rooms for 4 nights.",
          requestedBy: "Ramesh Sharma (Front Desk Lead)",
          amount: 28000,
          status: "pending",
        },
        {
          hotelId: "hotel-101",
          hotelName: "Meridian Grand Plaza",
          type: "refund",
          title: "Refund Request — Booking #RES-10311 Early Cancellation",
          details: "Guest flight cancelled due to weather. Requesting 100% refund waiver.",
          requestedBy: "Sunita Rao (Reservation Exec)",
          amount: 8500,
          status: "pending",
        },
        {
          hotelId: "hotel-101",
          hotelName: "Meridian Grand Plaza",
          type: "purchase_order",
          title: "Emergency Purchase Order — Pool Water Filtration Pump",
          details: "Pool filtration unit motor burned out; replacement requested from Apex Engineering.",
          requestedBy: "Mahesh (Chief Engineer)",
          amount: 34500,
          status: "pending",
        },
      ]);
      console.log("✅ Seeded Area Manager Approval Requests.");
    }

    // 10. Seed AI Knowledge Base Items
    const kbCount = await AIKnowledge.countDocuments();
    if (kbCount === 0) {
      await AIKnowledge.insertMany([
        {
          category: "Check-in / Check-out",
          question: "What are the standard check-in and check-out times?",
          answer: "Our standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in or late check-out is subject to room availability upon request at the front desk.",
          keywords: ["check-in", "check-out", "timing", "hours", "late checkout", "early checkin"],
        },
        {
          category: "Amenities & Facilities",
          question: "Do you offer complimentary breakfast and high-speed Wi-Fi?",
          answer: "Yes! High-speed Wi-Fi (up to 300 Mbps) is complimentary in all guest rooms and public areas. Our gourmet breakfast buffet is served daily from 7:00 AM to 10:30 AM at the Pavilion Restaurant.",
          keywords: ["breakfast", "wifi", "internet", "food", "timing", "pool", "gym"],
        },
        {
          category: "Policies & Rules",
          question: "What is your cancellation policy?",
          answer: "Reservations cancelled up to 24 hours prior to check-in receive a 100% full refund. Same-day cancellations or no-shows incur a one-night room charge.",
          keywords: ["cancel", "cancellation", "refund", "policy", "rules"],
        },
      ]);
      console.log("✅ Seeded AI Knowledge Base.");
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
  }
};

// Allow running directly via `node src/data/seed.js`
if (require.main === module) {
  require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
  const connectDB = require("../db");

  connectDB()
    .then(async () => {
      await seedDatabase();
      console.log("🌱 Database seeding completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database connection failed during seeding:", err.message);
      process.exit(1);
    });
}

module.exports = seedDatabase;
