const express = require("express");
const MaintenanceController = require("../controllers/maintenance.controller");

const router = express.Router();

router.get("/requests", MaintenanceController.getMaintenanceRequests);
router.post("/requests", MaintenanceController.createMaintenanceRequest);
router.patch("/requests/:id/status", MaintenanceController.updateMaintenanceStatus);

router.get("/lost-and-found", MaintenanceController.getLostAndFound);
router.post("/lost-and-found", MaintenanceController.createLostAndFound);
router.patch("/lost-and-found/:id/claim", MaintenanceController.claimLostAndFound);

module.exports = router;
