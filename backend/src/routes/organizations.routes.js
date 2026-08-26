const express = require("express");
const { mockOrganizations } = require("../data/mockData");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/organizations
 * Super Admin only
 */
router.get("/", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    count: mockOrganizations.length,
    data: mockOrganizations,
  });
});

/**
 * GET /api/organizations/:id
 */
router.get("/:id", verifyToken, (req, res) => {
  const org = mockOrganizations.find((o) => o.id === req.params.id);
  if (!org) {
    return res.status(404).json({
      success: false,
      message: "Organization not found",
    });
  }
  return res.status(200).json({
    success: true,
    data: org,
  });
});

/**
 * POST /api/organizations
 */
router.post("/", verifyToken, requireRole(["super_admin"]), (req, res) => {
  const { name, code, ownerName, ownerEmail, hotelsCount, activeRooms, monthlyRevenue } =
    req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: "Organization name and code are required",
    });
  }

  const newOrg = {
    id: `org-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    ownerName: ownerName || "Admin",
    ownerEmail: ownerEmail || "admin@example.com",
    hotelsCount: hotelsCount || 1,
    activeRooms: activeRooms || 50,
    monthlyRevenue: monthlyRevenue || 0,
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  };

  mockOrganizations.push(newOrg);

  return res.status(201).json({
    success: true,
    message: "Organization created successfully",
    data: newOrg,
  });
});

module.exports = router;
