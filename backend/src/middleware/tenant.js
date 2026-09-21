/**
 * Middleware: Tenant Identification & Isolation
 * Extracts organization and hotel context from:
 * 1. Authenticated user token (req.user.orgId, req.user.hotelId)
 * 2. Headers x-tenant-id / x-hotel-id
 * 3. Query parameter or request body
 */
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "hos_super_secret_jwt_key_development_2026";

function identifyTenant(req, res, next) {
  // If req.user is not yet populated, decode from Authorization Bearer token if present
  if (!req.user && req.headers["authorization"]) {
    try {
      const parts = req.headers["authorization"].split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        const token = parts[1];
        if (token.startsWith("mock_jwt_token_")) {
          const rolePart = token.replace("mock_jwt_token_", "").replace(/_\d+$/, "") || "super_admin";
          req.user = { role: rolePart };
        } else if (token !== "dev_session_token") {
          const decoded = jwt.verify(token, JWT_SECRET);
          req.user = decoded;
        }
      }
    } catch (e) {
      // ignore invalid token in tenant identifier
    }
  }

  const userOrgId = req.user?.orgId;
  const userHotelId = req.user?.hotelId;
  const userHotelName = req.user?.hotelName;
  const userRole = req.user?.role;

  const headerOrgId = req.headers["x-tenant-id"] || req.headers["x-org-id"];
  const headerHotelId = req.headers["x-hotel-id"];
  const headerHotelName = req.headers["x-hotel-name"];

  const queryOrgId = req.query.orgId || req.body?.orgId;
  const queryHotelId = req.query.hotelId || req.body?.hotelId;
  const queryHotelName = req.query.hotelName || req.body?.hotelName;

  let resolvedOrgId = userOrgId || null;
  // Super admins can switch tenant context dynamically
  if (userRole === "super_admin") {
    resolvedOrgId = queryOrgId || headerOrgId || userOrgId || null;
  } else if (!resolvedOrgId) {
    resolvedOrgId = (queryOrgId && queryOrgId !== "org-1" && queryOrgId !== "all" ? queryOrgId : null) || headerOrgId || null;
  }

  let resolvedHotelId = queryHotelId || headerHotelId || userHotelId || null;
  let resolvedHotelName = queryHotelName || headerHotelName || userHotelName || null;

  req.tenant = {
    orgId: resolvedOrgId,
    hotelId: resolvedHotelId,
    hotelName: resolvedHotelName,
    role: userRole || null,
    isMultiProperty: ["super_admin", "hotel_admin", "area_manager"].includes(userRole),
  };

  next();
}

module.exports = {
  identifyTenant,
};
