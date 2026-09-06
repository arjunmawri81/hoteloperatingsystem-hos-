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
    origin: ["http://localhost:3000", "http://localhost:3001", CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    initFirebase();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("No users found in database. Seeding initial data...");
      await seedDatabase();
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
