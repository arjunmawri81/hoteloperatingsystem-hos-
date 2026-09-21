const express = require("express");
const CashCounterController = require("../controllers/cashCounter.controller");
const { identifyTenant } = require("../middleware/tenant");

const router = express.Router();

router.get("/current", identifyTenant, CashCounterController.getCurrentShift);
router.post("/open", identifyTenant, CashCounterController.openShift);
router.post("/transaction", identifyTenant, CashCounterController.recordTransaction);
router.post("/close", identifyTenant, CashCounterController.closeShift);
router.get("/history", identifyTenant, CashCounterController.getShiftHistory);

module.exports = router;
