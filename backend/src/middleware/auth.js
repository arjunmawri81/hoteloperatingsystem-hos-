const jwt = require("jsonwebtoken");
const { mockUsers } = require("../data/mockData");

const JWT_SECRET = process.env.JWT_SECRET || "hos_super_secret_jwt_key_development_2026";

/**
 * Middleware: Verify JWT Bearer Token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token missing in Authorization header (Bearer <token>)",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      success: false,
      message: "Invalid token format. Expected: Bearer <token>",
    });
  }

  const token = parts[1];

  // Dev bypass for simulated tokens
  if (token.startsWith("mock_jwt_token_") || token === "dev_session_token") {
    const rolePart = token.replace("mock_jwt_token_", "").split("_")[0] || "super_admin";
    const foundUser = mockUsers.find((u) => u.role === rolePart) || mockUsers[0];
    req.user = foundUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
      error: err.message,
    });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User context not found",
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of following roles [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};
