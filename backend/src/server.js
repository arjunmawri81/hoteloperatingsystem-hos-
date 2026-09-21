require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./db");
const { initFirebase } = require("./config/firebase");
const User = require("./models/User");
const seedDatabase = require("./data/seed");
const apiRoutes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, postman, SSR) or any local dev origin
      if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:") || origin === CLIENT_URL) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
      "x-org-id",
      "x-tenant-id",
      "x-hotel-id",
      "x-hotel-name",
      "x-request-id",
    ],
  })
);
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Standardized Request ID Generator (PDF Sec 20)
app.use((req, res, next) => {
  req.requestId = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ENDPOINT_NOT_FOUND",
      message: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
    },
    requestId: req.requestId,
  });
});

// Global Error Handler (PDF Sec 20 standardized format)
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Unhandled Server Error:`, err);
  const statusCode = err.status || 500;
  const errorCode = err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR");

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || "Internal Server Error",
    },
    requestId: req.requestId || `REQ-${Date.now().toString().slice(-6)}`,
  });
});

// Start Server
const startServer = async () => {
  try {
    const dbConn = await connectDB();
    initFirebase();

    if (dbConn) {
      try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log("No users found in database. Seeding initial data...");
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn("Seeding check skipped:", seedErr.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`📡 API Base URL:      http://localhost:${PORT}/api`);
      console.log(`🩺 Health check:      http://localhost:${PORT}/api/health`);
      console.log(`🌐 Allowed Client:    ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
// Reloaded with new MongoDB Atlas cluster
