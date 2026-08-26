const express = require("express");
const jwt = require("jsonwebtoken");
const { mockUsers, mockOrganizations } = require("../data/mockData");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "hos_super_secret_jwt_key_development_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * POST /api/auth/login
 * Body: { email, password, role? }
 */
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Find user by email or by selected role
  let user = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user && role) {
    user = mockUsers.find((u) => u.role === role);
  }

  if (!user) {
    // Generate dynamic user for unknown email in development
    user = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0].replace(".", " "),
      email: email,
      role: role || "super_admin",
      orgId: "org-1",
      orgName: "Meridian Hospitality Group",
    };
    mockUsers.push(user);
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
    orgName: user.orgName,
    hotelId: user.hotelId,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const { passwordHash, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: safeUser,
    expiresIn: 86400 * 7,
  });
});

/**
 * POST /api/auth/register
 * Body: { orgName, orgCode, adminName, email, phone, password }
 */
router.post("/register", (req, res) => {
  const { orgName, orgCode, adminName, email, phone, password } = req.body;

  if (!orgName || !email || !adminName) {
    return res.status(400).json({
      success: false,
      message: "orgName, email, and adminName are required",
    });
  }

  const existing = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  const newOrgId = `org-${(orgCode || "ORG").toLowerCase()}-${Date.now()}`;
  const newOrg = {
    id: newOrgId,
    name: orgName,
    code: orgCode || "ORG",
    ownerName: adminName,
    ownerEmail: email,
    hotelsCount: 1,
    activeRooms: 50,
    monthlyRevenue: 0,
    status: "trial",
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockOrganizations.push(newOrg);

  const newUser = {
    id: `usr-${Date.now()}`,
    name: adminName,
    email: email,
    phone: phone,
    role: "hotel_admin",
    orgId: newOrgId,
    orgName: orgName,
  };
  mockUsers.push(newUser);

  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      orgId: newUser.orgId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(201).json({
    success: true,
    message: "Organization registered successfully",
    token,
    user: newUser,
  });
});

/**
 * GET /api/auth/me
 * Protected
 */
router.get("/me", verifyToken, (req, res) => {
  const found = mockUsers.find((u) => u.id === req.user.id);
  if (!found) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
  const { passwordHash, ...safeUser } = found;
  return res.status(200).json({
    success: true,
    user: safeUser,
  });
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
