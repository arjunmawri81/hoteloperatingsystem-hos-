const express = require("express");
const ApprovalsController = require("../controllers/approvals.controller");

const router = express.Router();

router.get("/", ApprovalsController.getApprovals);
router.post("/", ApprovalsController.createApproval);
router.post("/:id/action", ApprovalsController.actOnApproval);

module.exports = router;
