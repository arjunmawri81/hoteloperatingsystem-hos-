const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validator");

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post("/login", validate(schemas.authLogin), AuthController.login);

/**
 * POST /api/auth/register
 */
router.post("/register", validate(schemas.authRegister), AuthController.register);

/**
 * POST /api/auth/signup (Create Individual User Account)
 */
router.post("/signup", validate(schemas.authSignup), AuthController.signup);
router.post("/create-account", validate(schemas.authSignup), AuthController.signup);

/**
 * GET /api/auth/me
 */
router.get("/me", verifyToken, AuthController.getMe);

/**
 * POST /api/auth/logout
 */
router.post("/logout", AuthController.logout);

module.exports = router;
