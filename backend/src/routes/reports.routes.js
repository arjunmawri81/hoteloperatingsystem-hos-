const express = require("express");
const ReportsController = require("../controllers/reports.controller");

const router = express.Router();

router.get("/kpis", ReportsController.getKPIs);
router.get("/export/reservations", ReportsController.exportReservations);

module.exports = router;
