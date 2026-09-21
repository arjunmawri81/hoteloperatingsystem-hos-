require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Organization = require("../models/Organization");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Staff = require("../models/Staff");
const Reservation = require("../models/Reservation");
const Guest = require("../models/Guest");
const HousekeepingTask = require("../models/HousekeepingTask");
const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");
const PurchaseInward = require("../models/PurchaseInward");
const PurchaseOrder = require("../models/PurchaseOrder");
const StockIssue = require("../models/StockIssue");
const StockTransaction = require("../models/StockTransaction");
const RestaurantOrder = require("../models/RestaurantOrder");
const KOT = require("../models/KOT");
const Invoice = require("../models/Invoice");
const AuditLog = require("../models/AuditLog");
const Complaint = require("../models/Complaint");
const EventBooking = require("../models/EventBooking");
const LostAndFound = require("../models/LostAndFound");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const ApprovalRequest = require("../models/ApprovalRequest");
const Lead = require("../models/Lead");
const AIConversation = require("../models/AIConversation");
const ChannelMapping = require("../models/ChannelMapping");
const SyncLog = require("../models/SyncLog");
const InventoryRestriction = require("../models/InventoryRestriction");
const RatePlan = require("../models/RatePlan");
const Area = require("../models/Area");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hos";

async function reset() {
  console.log("Connecting to MongoDB for full database reset...");
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });
  console.log("Connected to MongoDB!");

  console.log("Deleting transactional & hotel data...");
  await Promise.all([
    Hotel.deleteMany({}),
    Staff.deleteMany({}),
    Room.deleteMany({}),
    Reservation.deleteMany({}),
    Guest.deleteMany({}),
    HousekeepingTask.deleteMany({}),
    CashShift.deleteMany({}),
    CashTransaction.deleteMany({}),
    PurchaseInward.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    StockIssue.deleteMany({}),
    StockTransaction.deleteMany({}),
    RestaurantOrder.deleteMany({}),
    KOT.deleteMany({}),
    Invoice.deleteMany({}),
    AuditLog.deleteMany({}),
    Complaint.deleteMany({}),
    EventBooking.deleteMany({}),
    LostAndFound.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    ApprovalRequest.deleteMany({}),
    Lead.deleteMany({}),
    AIConversation.deleteMany({}),
    ChannelMapping.deleteMany({}),
    SyncLog.deleteMany({}),
    InventoryRestriction.deleteMany({}),
    RatePlan.deleteMany({}),
    Area.deleteMany({}),
    Organization.deleteMany({}),
  ]);
  console.log("Deleted all hotels, staff, rooms, bookings, cash shifts, stock, orders, and organizations.");

  console.log("Deleting non-superadmin users...");
  await User.deleteMany({ role: { $ne: "super_admin" } });

  // Prepare Super Admin with clean known password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password@123", salt);

  const existingSuperAdmin = await User.findOne({ role: "super_admin" });
  if (existingSuperAdmin) {
    existingSuperAdmin.email = "superadmin@hos.com";
    existingSuperAdmin.name = "Super Administrator";
    existingSuperAdmin.passwordHash = passwordHash;
    existingSuperAdmin.status = "active";
    existingSuperAdmin.hotelId = null;
    existingSuperAdmin.orgId = null;
    await existingSuperAdmin.save();
    console.log("Updated existing Super Admin credentials.");
  } else {
    await User.create({
      id: "usr-super-admin-01",
      email: "superadmin@hos.com",
      name: "Super Administrator",
      role: "super_admin",
      passwordHash: passwordHash,
      status: "active",
    });
    console.log("Created brand new Super Admin user.");
  }

  const remainingUsers = await User.find({}, "email role name");
  console.log("DATABASE RESET COMPLETE!");
  console.log("Remaining users in database:", remainingUsers);

  await mongoose.disconnect();
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
