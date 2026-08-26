require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Route handlers
const authRoutes = require("./routes/auth.routes");
const organizationsRoutes = require("./routes/organizations.routes");
const hotelsRoutes = require("./routes/hotels.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const housekeepingRoutes = require("./routes/housekeeping.routes");
const posRoutes = require("./routes/pos.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Global Middlewares
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "HOS Backend API Server",
    version: "1.0.0",
  });
});

// API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/hotels", hotelsRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/ai", aiRoutes);

// 404 Route Catch-all
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
app.listen(PORT, () => {
  console.log(`
=====================================================
  🏨 HOS (Hotel Operating System) Backend API
=====================================================
  🚀 Server running on: http://localhost:${PORT}
  📡 API Base URL:      http://localhost:${PORT}/api
  🩺 Health check:      http://localhost:${PORT}/api/health
  🌐 Allowed Client:    ${CLIENT_URL}
=====================================================
  Ready for Database & Controller customization!
=====================================================
  `);
});

module.exports = app;
