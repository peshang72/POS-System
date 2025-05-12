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

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB configuration with better online/offline mode handling
  mongoURI: isElectron
    ? "mongodb://localhost:27017/offline-pos"
    : process.env.MONGO_URI || "mongodb://localhost:27017/gaming-store-pos",

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret_key",
  jwtExpire: process.env.JWT_EXPIRE || "1d",
  jwtCookie: process.env.JWT_COOKIE_EXPIRE || 1,

  // Flag for offline mode
  isOfflineMode: isElectron,

  // File upload configuration
  fileUploadPath: process.env.FILE_UPLOAD_PATH || "public/uploads",
  maxFileSize: process.env.MAX_FILE_SIZE || 1000000, // 1MB in bytes

  // Thermal printer configuration
  printerType: process.env.PRINTER_TYPE || "epson",
  printerInterface: process.env.PRINTER_INTERFACE || "/dev/usb/lp0",
};
