require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./db");
const User = require("./models/User");
const seedDatabase = require("./data/seed");

// Route handlers
const authRoutes = require("./routes/auth.routes");
const organizationsRoutes = require("./routes/organizations.routes");
const hotelsRoutes = require("./routes/hotels.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const housekeepingRoutes = require("./routes/housekeeping.routes");
const posRoutes = require("./routes/pos.routes");
const aiRoutes = require("./routes/ai.routes");
const invoicesRoutes = require("./routes/invoices.routes");
const areasRoutes = require("./routes/areas.routes");
const staffRoutes = require("./routes/staff.routes");
const guestsRoutes = require("./routes/guests.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const leadsRoutes = require("./routes/leads.routes");
const roomsRoutes = require("./routes/rooms.routes");

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
app.use("/api/invoices", invoicesRoutes);
app.use("/api/areas", areasRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/rooms", roomsRoutes);

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

// Connect Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("ℹ️ No users found in database. Seeding initial mock data...");
      await seedDatabase();
    } else {
      console.log("ℹ️ Database contains existing data. Skipping auto-seed.");
    }

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
  Connected to MongoDB & Ready for Operations!
=====================================================
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start HOS server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
