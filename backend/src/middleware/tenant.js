/**
 * Middleware: Tenant Identification & Isolation
 * Extracts organization and hotel context from:
 * 1. Authenticated user token (req.user.orgId, req.user.hotelId)
 * 2. Headers x-tenant-id / x-hotel-id
 * 3. Query parameter or request body
 */
function identifyTenant(req, res, next) {
  const userOrgId = req.user?.orgId;
  const userHotelId = req.user?.hotelId;
  const userRole = req.user?.role;

  const headerOrgId = req.headers["x-tenant-id"] || req.headers["x-org-id"];
  const headerHotelId = req.headers["x-hotel-id"];

  const queryOrgId = req.query.orgId || req.body?.orgId;
  const queryHotelId = req.query.hotelId || req.body?.hotelId;

  let resolvedOrgId = userOrgId || headerOrgId || queryOrgId || "org-1";
  let resolvedHotelId = userHotelId || headerHotelId || queryHotelId;

  // Super admins can switch tenant context dynamically
  if (userRole === "super_admin" && (headerOrgId || queryOrgId)) {
    resolvedOrgId = headerOrgId || queryOrgId;
  }

  req.tenant = {
    orgId: resolvedOrgId,
    hotelId: resolvedHotelId,
    isMultiProperty: ["super_admin", "hotel_admin", "area_manager"].includes(userRole),
  };

  next();
}

module.exports = {
  identifyTenant,
};
