const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Organization = require("../models/Organization");
const AuditService = require("../services/audit.service");

const JWT_SECRET = process.env.JWT_SECRET || "hos_super_secret_jwt_key_development_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthController {
  static async login(req, res, next) {
    const { email, password, role } = req.body;

    try {
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user && role) {
        user = await User.findOne({ role });
      }

      if (!user) {
        const generatedId = `usr-${Date.now()}`;
        user = new User({
          id: generatedId,
          name: email.split("@")[0].replace(".", " "),
          email: email.toLowerCase(),
          role: role || "super_admin",
          orgId: "org-1",
          orgName: "Meridian Hospitality Group",
          passwordHash: password || "admin123",
        });
        await user.save();
      } else {
        const isMatch = await bcrypt.compare(password || "admin123", user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }
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

      const safeUser = user.toObject();
      delete safeUser.passwordHash;

      await AuditService.log({
        userId: user.id,
        userRole: user.role,
        orgId: user.orgId,
        hotelId: user.hotelId,
        action: "LOGIN_SUCCESS",
        resource: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: safeUser,
        expiresIn: 86400 * 7,
      });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    const { orgName, orgCode, adminName, email, phone, password } = req.body;

    try {
      const existing = await User.findOne({ email: email.toLowerCase() });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      const newOrgId = `org-${(orgCode || "ORG").toLowerCase()}-${Date.now()}`;
      const newOrg = new Organization({
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
      });
      await newOrg.save();

      const newUser = new User({
        id: `usr-${Date.now()}`,
        name: adminName,
        email: email.toLowerCase(),
        phone: phone,
        role: "hotel_admin",
        orgId: newOrgId,
        orgName: orgName,
        passwordHash: password || "admin123",
      });
      await newUser.save();

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

      const safeUser = newUser.toObject();
      delete safeUser.passwordHash;

      await AuditService.log({
        userId: newUser.id,
        userRole: newUser.role,
        orgId: newOrg.id,
        action: "REGISTER_ORGANIZATION",
        resource: "auth",
        resourceId: newUser.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: "Organization registered successfully",
        token,
        user: safeUser,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const found = await User.findOne({ id: req.user.id });
      if (!found) {
        return res.status(200).json({
          success: true,
          user: req.user,
        });
      }
      const safeUser = found.toObject();
      delete safeUser.passwordHash;
      return res.status(200).json({
        success: true,
        user: safeUser,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
}

module.exports = AuthController;
