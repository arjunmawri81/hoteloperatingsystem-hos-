const HousekeepingTask = require("../models/HousekeepingTask");
const AuditService = require("./audit.service");

class HousekeepingService {
  static async listTasks({ status, floor }) {
    const filter = {};
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);
    return await HousekeepingTask.find(filter);
  }

  static async updateStatus({ id, status, assignedTo, user, tenant, ipAddress }) {
    const task = await HousekeepingTask.findOne({ id });
    if (!task) {
      const error = new Error("Housekeeping task not found");
      error.status = 404;
      throw error;
    }

    const previousStatus = task.status;
    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;

    if (status === "clean") {
      task.lastCleaned = `Today ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (status === "cleaning") {
      task.lastCleaned = "In progress";
    }

    await task.save();

    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "housekeeping",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "UPDATE_HOUSEKEEPING",
      resource: "housekeeping",
      resourceId: id,
      details: { roomNumber: task.roomNumber, previousStatus, newStatus: status, assignedTo },
      ipAddress,
    });

    return task;
  }
}

module.exports = HousekeepingService;
