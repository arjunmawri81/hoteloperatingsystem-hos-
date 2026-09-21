const HousekeepingService = require("../services/housekeeping.service");
const HousekeepingTask = require("../models/HousekeepingTask");
const Room = require("../models/Room");
const AuditLog = require("../models/AuditLog");

class HousekeepingController {
  static async getAll(req, res, next) {
    try {
      const tasks = await HousekeepingService.listTasks({
        status: req.query.status,
        floor: req.query.floor,
        tenant: req.tenant,
        user: req.user,
        filters: req.query,
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
        notes: req.body.notes,
        roomType: req.body.roomType,
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

  // --- Toggle Checklist Item ---
  static async updateChecklist(req, res, next) {
    try {
      const { id } = req.params;
      const { itemIndex, completed } = req.body;

      const task = await HousekeepingTask.findOne({ id });
      if (!task) return res.status(404).json({ success: false, message: "Task not found" });

      if (task.checklist && task.checklist[itemIndex] !== undefined) {
        task.checklist[itemIndex].completed = !!completed;
        await task.save();
      }

      return res.status(200).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  // --- Supervisor Room Inspection Workflow ---
  static async inspectTask(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks = "" } = req.body; // 'passed' | 'failed'

      const task = await HousekeepingTask.findOne({ id });
      if (!task) return res.status(404).json({ success: false, message: "Task not found" });

      task.inspection = {
        inspectedBy: req.user?.name || "Housekeeping Supervisor",
        status: status === "passed" ? "passed" : "failed",
        remarks,
        inspectedAt: new Date(),
      };

      if (status === "passed") {
        task.status = "clean";
        // Also update Room status to available/clean strictly for this hotel
        const roomMatch = {
          number: task.roomNumber,
          ...(task.hotelId ? { hotelId: task.hotelId } : task.orgId ? { orgId: task.orgId } : {}),
        };
        await Room.findOneAndUpdate(
          roomMatch,
          { status: "available" }
        );
      } else {
        task.status = "dirty"; // Needs re-cleaning
      }

      await task.save();

      // Audit Log
      await AuditLog.create({
        user: req.user?.name || "Housekeeping Supervisor",
        action: "ROOM_INSPECTION",
        resource: `Room #${task.roomNumber}`,
        oldValue: "cleaning/inspection",
        newValue: status === "passed" ? "clean (available)" : "failed (re-cleaning required)",
        ip: req.ip || "127.0.0.1",
        device: req.headers["user-agent"] || "Web",
      });

      return res.status(200).json({
        success: true,
        message: `Inspection recorded: ${status.toUpperCase()} for Room ${task.roomNumber}`,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HousekeepingController;
