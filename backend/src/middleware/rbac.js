/**
 * Middleware: Role-Based Access Control (RBAC) and Hotel Permissions
 */
const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  hotel_admin: ["manage_hotels", "view_reports", "manage_staff", "view_operations"],
  area_manager: ["view_regional_hotels", "view_reports", "view_operations"],
  hotel_manager: ["manage_reservations", "manage_housekeeping", "manage_pos", "view_property"],
  receptionist: ["manage_reservations", "view_housekeeping"],
  housekeeping: ["manage_housekeeping"],
  customer: ["view_hotels", "create_reservation", "view_own_reservation"],
  ai_receptionist: ["manage_reservations", "manage_housekeeping", "view_ai"],
};

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing authentication context",
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role [${req.user.role}] does not have required permissions [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}

function checkHotelPermission(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing user authentication context",
    });
  }

  if (["super_admin", "hotel_admin", "area_manager"].includes(req.user.role)) {
    return next();
  }

  const targetHotelId =
    req.params.hotelId ||
    req.body?.hotelId ||
    req.query?.hotelId ||
    req.tenant?.hotelId;

  if (targetHotelId && req.user.hotelId && targetHotelId !== req.user.hotelId) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: You do not have permissions to access Hotel ID [${targetHotelId}]`,
    });
  }

  next();
}

module.exports = {
  requireRole,
  checkHotelPermission,
  ROLE_PERMISSIONS,
};
