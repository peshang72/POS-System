/**
 * Authentication middleware
 * Centralizes authentication and authorization functions
 */
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const config = require("../config");
const logger = require("../utils/logger");

// Check if running in Electron environment
const isElectron = process.env.ELECTRON_ENV === "true";

// Protect routes - middleware to validate JWT and attach user to request
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers (Authorization: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Extract token from Bearer header
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookies (for browser clients)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Log when no token is found
  if (!token) {
    logger.warn(
      `No authentication token provided for route: ${req.originalUrl}`
    );
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this resource",
    });
  }

  try {
    // Verify token with JWT
    const decoded = jwt.verify(token, config.jwtSecret);

    // If in Electron mode, we handle this special case
    if (isElectron) {
      // For Electron we use a default admin user from the token ID
      if (decoded.id === "electron-admin-id") {
        logger.info(`[Electron Mode] Admin user authenticated via JWT`);

        // Create a special admin user object for electron
        req.user = {
          _id: "electron-admin-id",
          username: "admin",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          active: true,
          languagePreference: "en",
        };

        return next();
      }
    }

    // Get user from database (standard flow)
    const user = await User.findById(decoded.id);

    // Check if user exists
    if (!user) {
      logger.warn(`User not found for token with ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Check if user is active
    if (!user.active) {
      logger.warn(
        `Inactive user attempted to access protected route: ${user.username}`
      );
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Attach user to request object for use in protected routes
    req.user = user;
    next();
  } catch (err) {
    logger.error(`Token validation error: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this resource",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to perform this action`,
      });
    }

    next();
  };
};
