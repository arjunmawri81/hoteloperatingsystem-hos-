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

module.exports = router;
