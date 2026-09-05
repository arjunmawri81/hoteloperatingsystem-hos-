const HousekeepingService = require("../services/housekeeping.service");

class HousekeepingController {
  static async getAll(req, res, next) {
    try {
      const tasks = await HousekeepingService.listTasks({
        status: req.query.status,
        floor: req.query.floor,
      });
      return res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const task = await HousekeepingService.createTask({
        roomNumber: req.body.roomNumber,
        assignedTo: req.body.assignedTo,
        priority: req.body.priority,
        status: req.body.status,
        floor: req.body.floor,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(201).json({
        success: true,
        message: "Housekeeping task created",
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const task = await HousekeepingService.updateStatus({
        id: req.params.id,
        status: req.body.status,
        assignedTo: req.body.assignedTo,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(200).json({
        success: true,
        message: "Housekeeping task updated",
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HousekeepingController;
