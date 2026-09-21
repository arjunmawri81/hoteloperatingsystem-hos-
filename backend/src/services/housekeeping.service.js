const HousekeepingTask = require("../models/HousekeepingTask");
const Room = require("../models/Room");
const AuditService = require("./audit.service");

class HousekeepingService {
  static async listTasks({ status, floor, tenant, user, filters = {} }) {
    const filter = {};
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);

    const userRole = user?.role || tenant?.role;
    let targetOrgId = user?.orgId || tenant?.orgId;
    if (userRole === "super_admin") {
      targetOrgId = filters.orgId || tenant?.orgId || null;
    } else if (!targetOrgId && filters.orgId && filters.orgId !== "all" && filters.orgId !== "org-1") {
      targetOrgId = filters.orgId;
    }

    const targetHotelId = filters.hotelId || tenant?.hotelId || user?.hotelId;

    if (userRole === "super_admin" && !targetHotelId && !targetOrgId) {
      // super_admin sees all
    } else if (targetHotelId) {
      filter.hotelId = targetHotelId;
    } else if (targetOrgId && targetOrgId !== "all") {
      filter.orgId = targetOrgId;
    } else if (userRole && userRole !== "super_admin") {
      return [];
    }

    let tasks = await HousekeepingTask.find(filter);

    // If no housekeeping tasks exist yet, synchronize from matching Room records in database
    if (tasks.length === 0 && !status && !floor) {
      const roomQuery = {};
      if (targetHotelId) roomQuery.hotelId = targetHotelId;
      else if (targetOrgId && targetOrgId !== "all") roomQuery.orgId = targetOrgId;

      const rooms = await Room.find(roomQuery);
      if (rooms.length > 0) {
        const initialTasks = rooms.map((r) => {
          let taskStatus = "clean";
          if (r.status === "dirty") taskStatus = "dirty";
          else if (r.status === "out_of_order") taskStatus = "dirty";
          else if (r.status === "occupied") taskStatus = "clean";

          return {
            id: `hk-${r.number}-${Date.now().toString().slice(-4)}`,
            roomNumber: r.number,
            roomType: r.type || "Standard Room",
            floor: r.floor || Number(r.number[0]) || 1,
            hotelId: r.hotelId || targetHotelId || "",
            orgId: r.orgId || targetOrgId || "",
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

  static async createTask({ roomNumber, assignedTo, priority, status, floor, notes, roomType, hotelId, orgId, user, tenant, ipAddress }) {
    const taskId = `hk-${Date.now()}`;
    const targetHotelId = hotelId || tenant?.hotelId || user?.hotelId || "";
    const targetOrgId = orgId || tenant?.orgId || user?.orgId || "";

    const task = await HousekeepingTask.create({
      id: taskId,
      roomNumber,
      hotelId: targetHotelId,
      orgId: targetOrgId,
      roomType: roomType || "Standard Room",
      assignedTo: assignedTo || "Unassigned",
      priority: priority || "medium",
      status: status || "dirty",
      floor: Number(floor) || Number(roomNumber[0]) || 1,
      notes: notes || "",
    });

    // Bidirectional sync with Room model
    const roomMatch = {
      number: { $in: [String(roomNumber).trim(), `Room ${String(roomNumber).trim()}`] },
      ...(targetHotelId ? { hotelId: targetHotelId } : targetOrgId ? { orgId: targetOrgId } : {}),
    };

    if (status === "dirty" || status === "cleaning") {
      await Room.updateMany(
        roomMatch,
        { status: "dirty", cleaner: assignedTo || "Unassigned", housekeepingStatus: "dirty" }
      );
    } else if (status === "clean" || status === "inspected" || status === "inspection") {
      await Room.updateMany(
        roomMatch,
        { status: "available", cleaner: assignedTo || "Unassigned", housekeepingStatus: "clean" }
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

    const roomMatch = {
      number: task.roomNumber,
      ...(task.hotelId ? { hotelId: task.hotelId } : task.orgId ? { orgId: task.orgId } : {}),
    };

    if (status === "clean" || status === "inspected") {
      task.lastCleaned = `Today ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      // Sync with Room inventory: mark room available
      await Room.findOneAndUpdate(
        roomMatch,
        { status: "available", cleaner: assignedTo || task.assignedTo }
      );
    } else if (status === "cleaning") {
      task.lastCleaned = "In progress";
      await Room.findOneAndUpdate(
        roomMatch,
        { status: "dirty", cleaner: assignedTo || task.assignedTo }
      );
    } else if (status === "dirty") {
      await Room.findOneAndUpdate(
        roomMatch,
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
