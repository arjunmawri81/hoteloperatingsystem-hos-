const HousekeepingTask = require("../models/HousekeepingTask");
const Room = require("../models/Room");
const AuditService = require("./audit.service");

class HousekeepingService {
  static async listTasks({ status, floor }) {
    const filter = {};
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);

    let tasks = await HousekeepingTask.find(filter);

    // If no housekeeping tasks exist yet, synchronize from existing Room records in database
    if (tasks.length === 0 && !status && !floor) {
      const rooms = await Room.find();
      if (rooms.length > 0) {
        const initialTasks = rooms.map((r) => {
          let taskStatus = "clean";
          if (r.status === "dirty") taskStatus = "dirty";
          else if (r.status === "out_of_order") taskStatus = "dirty";
          else if (r.status === "occupied") taskStatus = "clean";

          return {
            id: `hk-${r.number}`,
            roomNumber: r.number,
            roomType: r.type || "Standard Room",
            floor: r.floor || Number(r.number[0]) || 1,
            status: taskStatus,
            assignedTo: r.cleaner || "Unassigned",
            priority: r.status === "dirty" ? "high" : "medium",
            lastCleaned: "Today",
          };
        });

        await HousekeepingTask.insertMany(initialTasks);
        tasks = await HousekeepingTask.find(filter);
      }
    }

    return tasks;
  }

  static async createTask({ roomNumber, assignedTo, priority, status, floor, user, tenant, ipAddress }) {
    const taskId = `hk-${Date.now()}`;
    const task = await HousekeepingTask.create({
      id: taskId,
      roomNumber,
      assignedTo: assignedTo || "Unassigned",
      priority: priority || "medium",
      status: status || "dirty",
      floor: Number(floor) || Number(roomNumber[0]) || 1,
    });

    // Bidirectional sync with Room model
    if (status === "dirty" || status === "cleaning") {
      await Room.findOneAndUpdate(
        { number: roomNumber },
        { status: "dirty", cleaner: assignedTo || "Unassigned" }
      );
    } else if (status === "clean" || status === "inspected" || status === "inspection") {
      await Room.findOneAndUpdate(
        { number: roomNumber },
        { status: "available", cleaner: assignedTo || "Unassigned" }
      );
    }

    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "housekeeping",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "CREATE_HOUSEKEEPING_TASK",
      resource: "housekeeping",
      resourceId: taskId,
      details: { roomNumber, status, priority, assignedTo },
      ipAddress,
    });

    return task;
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
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    if (status === "clean" || status === "inspected") {
      task.lastCleaned = `Today ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      // Sync with Room inventory: mark room available
      await Room.findOneAndUpdate(
        { number: task.roomNumber },
        { status: "available", cleaner: assignedTo || task.assignedTo }
      );
    } else if (status === "cleaning") {
      task.lastCleaned = "In progress";
      await Room.findOneAndUpdate(
        { number: task.roomNumber },
        { status: "dirty", cleaner: assignedTo || task.assignedTo }
      );
    } else if (status === "dirty") {
      await Room.findOneAndUpdate(
        { number: task.roomNumber },
        { status: "dirty" }
      );
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
