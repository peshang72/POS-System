const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const config = require("../config");

// Import route files
const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const categoryRoutes = require("./category.routes");
const customerRoutes = require("./customer.routes");
const transactionRoutes = require("./transaction.routes");
const reportRoutes = require("./report.routes");
const dashboardRoutes = require("./dashboard.routes");
const staffRoutes = require("./staff.routes");
const loyaltyRoutes = require("./loyalty.routes");
const expenseRoutes = require("./expense.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/customers", customerRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/staff", staffRoutes);
router.use("/loyalty", loyaltyRoutes);
router.use("/expenses", expenseRoutes);

// Basic root route
router.get("/", (req, res) => {
  res.json({
    message: "POS API - Welcome to the POS system API",
    version: "1.0.0",
    status: "running",
  });
});

// Health check route
router.get("/health", async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    server: "online",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: config.nodeEnv,
    isElectron: config.isOfflineMode,
  };

  res.json(health);
});

// Detailed database status check
router.get("/db-status", async (req, res) => {
  const dbStatus = {
    readyState: mongoose.connection.readyState,
    status: getConnectionStatusText(mongoose.connection.readyState),
    host: config.isOfflineMode ? "localhost" : "remote",
    models: Object.keys(mongoose.models),
    isOnline: !config.isOfflineMode,
  };

  // Perform a simple test query if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      dbStatus.pingTime = `${Date.now() - startTime}ms`;
      dbStatus.healthy = true;
    } catch (err) {
      dbStatus.healthy = false;
      dbStatus.error = err.message;
    }
  }

  res.json(dbStatus);
});

// Helper function to get connection status text
function getConnectionStatusText(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };
  return states[state] || "unknown";
}

module.exports = router;
