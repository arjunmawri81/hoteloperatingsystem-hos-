const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const organizationsRoutes = require("./organizations.routes");
const hotelsRoutes = require("./hotels.routes");
const reservationsRoutes = require("./reservations.routes");
const housekeepingRoutes = require("./housekeeping.routes");
const posRoutes = require("./pos.routes");
const aiRoutes = require("./ai.routes");
const invoicesRoutes = require("./invoices.routes");
const areasRoutes = require("./areas.routes");
const staffRoutes = require("./staff.routes");
const guestsRoutes = require("./guests.routes");
const inventoryRoutes = require("./inventory.routes");
const leadsRoutes = require("./leads.routes");
const roomsRoutes = require("./rooms.routes");

// New HOS Functional Modules
const banquetRoutes = require("./banquet.routes");
const channelManagerRoutes = require("./channelManager.routes");
const maintenanceRoutes = require("./maintenance.routes");
const approvalsRoutes = require("./approvals.routes");
const reportsRoutes = require("./reports.routes");

const { identifyTenant } = require("../middleware/tenant");
// Mount tenant isolation & context extraction globally for all API endpoints
router.use(identifyTenant);

router.use("/auth", authRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/hotels", hotelsRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/housekeeping", housekeepingRoutes);
router.use("/pos", posRoutes);
router.use("/ai", aiRoutes);
router.use("/invoices", invoicesRoutes);
router.use("/areas", areasRoutes);
router.use("/staff", staffRoutes);
router.use("/guests", guestsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/leads", leadsRoutes);
router.use("/rooms", roomsRoutes);

// Mount new routes
const ratePlansRoutes = require("./ratePlans.routes");
const inventoryRestrictionsRoutes = require("./inventoryRestrictions.routes");
const searchRoutes = require("./search.routes");

const cashCounterRoutes = require("./cashCounter.routes");

router.use("/banquet", banquetRoutes);
router.use("/channel-manager", channelManagerRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/approvals", approvalsRoutes);
router.use("/reports", reportsRoutes);
router.use("/rate-plans", ratePlansRoutes);
router.use("/inventory-restrictions", inventoryRestrictionsRoutes);
router.use("/search", searchRoutes);
router.use("/cash-counter", cashCounterRoutes);

module.exports = router;
