const AuditLog = require("../models/AuditLog");

class AuditService {
  /**
   * Record an action in the system audit log
   */
  static async log({
    userId = "system",
    userRole = "guest",
    orgId = "",
    hotelId = "",
    action,
    resource,
    resourceId = "",
    details = {},
    ipAddress = "",
    status = "SUCCESS",
  }) {
    try {
      const logEntry = new AuditLog({
        userId,
        userRole,
        orgId,
        hotelId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        status,
        timestamp: new Date(),
      });
      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.error("Failed to write audit log:", err.message);
      return null;
    }
  }
}

module.exports = AuditService;
