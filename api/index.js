// Server-side API handler for Vercel
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const { json, urlencoded } = require("express");

// Import routes
const authRoutes = require("../server/src/routes/auth.routes");
const productRoutes = require("../server/src/routes/product.routes");
const categoryRoutes = require("../server/src/routes/category.routes");
const transactionRoutes = require("../server/src/routes/transaction.routes");
const customerRoutes = require("../server/src/routes/customer.routes");
const settingRoutes = require("../server/src/routes/setting.routes");
const dashboardRoutes = require("../server/src/routes/dashboard.routes");
const loyaltyRoutes = require("../server/src/routes/loyalty.routes");

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(morgan("tiny"));

// Initialize Passport
app.use(passport.initialize());
require("../server/src/middleware/passport");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/loyalty", loyaltyRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: {},
  });
});

// Export the Express API
module.exports = app;
