const ReportsService = require("../services/reports.service");

// Get executive KPI dashboard data
exports.getKPIs = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const data = await ReportsService.getExecutiveKPIs(hotelId || "hotel-101");
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export reservations as CSV
exports.exportReservations = async (req, res) => {
  try {
    const csv = await ReportsService.exportReservationsCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reservations-report.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
