const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const path = require("path");
const config = require("./config");
const logger = require("./utils/logger");
const dbValidator = require("./utils/db-validator");

// Check if running in Electron environment - more robust detection
const isElectron = process.env.ELECTRON_ENV === "true";

// Log environment information at startup
logger.info(`Starting server in ${config.nodeEnv} mode`);
logger.info(`Electron mode: ${isElectron ? "enabled" : "disabled"}`);

// Import routes
const routes = require("./routes"); // Import main routes index
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const transactionRoutes = require("./routes/transaction.routes");
const customerRoutes = require("./routes/customer.routes");
const staffRoutes = require("./routes/staff.routes");
const reportRoutes = require("./routes/report.routes");
const settingRoutes = require("./routes/setting.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const loyaltyRoutes = require("./routes/loyalty.routes");

// Initialize Express app
const app = express();

// Direct CORS handling for preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Electron-App, X-Electron-Version"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use only basic logging in production
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("tiny"));
}

// Initialize Passport
app.use(passport.initialize());
require("./middleware/passport");

// API Routes
app.use("/api", routes); // Use the main routes index
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/loyalty", loyaltyRoutes); // Add direct loyalty routes

// Add debug route for auth testing in development
if (config.nodeEnv === "development") {
  app.get("/api/auth/status", (req, res) => {
    res.json({
      success: true,
      message: "Auth service is running",
      isElectron: isElectron,
    });
  });
}

// Health check route for DigitalOcean App Platform
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

// Add explicit debug handler for login in production
app.post("/auth/login", (req, res) => {
  logger.error("Caught request at /auth/login without /api prefix");
  // Forward to the correct route
  req.url = "/api/auth/login";
  app.handle(req, res);
});

// Extra direct route for auth login when routes get misconfigured
app.post("/api/auth/login", (req, res) => {
  logger.info("Direct login handler triggered");
  // Forward to the actual auth router
  authRoutes.handle(req, res);
});

// Serve static assets from client/dist in production
const clientPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientPath));

// Serve index.html for any route not handled by API
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(clientPath, "index.html"));
  } else {
    next();
  }
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  logger.error(`API route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
    detailedPath: req.originalUrl,
    suggestion: "Please check the API endpoint and request method",
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  logger.error(`Error at path ${req.method} ${req.path}: ${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    path: req.path,
    method: req.method,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server function with improved error handling
const startServer = () => {
  const PORT = config.port || 5000;
  try {
    // Make sure the port is not already in use
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Server accessible at http://0.0.0.0:${PORT}`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(
          `Port ${PORT} is already in use. Please try a different port.`
        );
        if (!isElectron) {
          process.exit(1);
        }
      } else {
        logger.error(`Server error: ${error.message}`);
      }
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    if (!isElectron) {
      process.exit(1);
    }
  }
};

// Always try to connect to MongoDB first, regardless of mode
// Log connection details before attempting to connect
const connectionDetails = dbValidator.getConnectionDetails(config.mongoURI);
logger.info(`Connecting to ${connectionDetails.type} database...`);

if (!connectionDetails.isValid) {
  logger.error(
    "Invalid MongoDB connection string format. Please check your .env file."
  );
}

// MongoDB connection options for better reliability
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Attempt to connect to MongoDB with retries
const connectWithRetry = (retryCount = 0, maxRetries = 5) => {
  mongoose
    .connect(config.mongoURI, mongooseOptions)
    .then(() => {
      logger.info("Connected to MongoDB");
      startServer();
    })
    .catch((err) => {
      logger.error(`MongoDB connection error: ${err.message}`);

      if (retryCount < maxRetries) {
        // Retry connection with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000;
        logger.info(
          `Retrying connection in ${retryDelay}ms... (${
            retryCount + 1
          }/${maxRetries})`
        );

        setTimeout(() => {
          connectWithRetry(retryCount + 1, maxRetries);
        }, retryDelay);
      } else {
        // In any mode, continue without MongoDB after max retries
        logger.warn("Continuing without MongoDB connection after max retries");
        startServer();
      }
    });
};

// Start connection process
connectWithRetry();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION:", err);
  // Only exit in non-Electron environments
  if (!isElectron) {
    process.exit(1);
  }
});
