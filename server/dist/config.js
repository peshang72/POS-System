const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load env vars from .env file
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Environment loaded from: ${envPath}`);
} else {
  console.log(`No .env file found at: ${envPath}`);
}

// Check if running in Electron environment
const isElectron = process.env.ELECTRON_ENV === "true";

// Is this a production deployment?
const isProduction = process.env.NODE_ENV === "production";

// Get CORS origin from env or use a default based on environment
const getCorsOrigin = () => {
  // Use explicit CORS_ORIGIN from env if available
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }

  // In Electron mode, explicitly allow localhost:3000 (dev server) and electron://
  if (isElectron) {
    return ["http://localhost:3000", "electron://"];
  }

  // In development, allow multiple origins
  if (!isProduction) {
    return [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:8080",
    ];
  }

  // In production, use a more restrictive setting
  return isProduction ? process.env.FRONTEND_URL || "*" : "*";
};

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB configuration - always use environment variable with fallback
  mongoURI:
    process.env.MONGO_URI || "mongodb://localhost:27017/gaming-store-pos",

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret_key",
  jwtExpire: process.env.JWT_EXPIRE || "1d",
  jwtCookie: process.env.JWT_COOKIE_EXPIRE || 1,

  // Flag for offline mode
  isOfflineMode: isElectron,

  // Is production deployment
  isProduction,

  // Enhanced CORS settings
  corsOptions: {
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Electron-App",
      "X-Electron-Version",
    ],
  },

  // File upload configuration
  fileUploadPath: process.env.FILE_UPLOAD_PATH || "public/uploads",
  maxFileSize: process.env.MAX_FILE_SIZE || 1000000, // 1MB in bytes

  // Thermal printer configuration
  printerType: process.env.PRINTER_TYPE || "epson",
  printerInterface: process.env.PRINTER_INTERFACE || "/dev/usb/lp0",
};
