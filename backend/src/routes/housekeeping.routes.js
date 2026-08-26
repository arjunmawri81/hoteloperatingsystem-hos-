const express = require("express");
const { mockHousekeepingTasks } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/housekeeping
 */
router.get("/", (req, res) => {
  const { status, floor } = req.query;
  let result = [...mockHousekeepingTasks];

  if (status) {
    result = result.filter((t) => t.status === status);
  }
  if (floor) {
    result = result.filter((t) => t.floor === Number(floor));
  }

  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * PATCH /api/housekeeping/:id/status
 */
router.patch("/:id/status", verifyToken, (req, res) => {
  const { status, assignedTo } = req.body;
  const task = mockHousekeepingTasks.find((t) => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Housekeeping task not found",
    });
  }

  if (status) task.status = status;
  if (assignedTo) task.assignedTo = assignedTo;

  return res.status(200).json({
    success: true,
    message: "Housekeeping task updated",
    data: task,
  });
});

module.exports = router;
