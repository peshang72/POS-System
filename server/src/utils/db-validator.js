/**
 * Database connection validator utility
 * Helps validate MongoDB connection parameters
 */

const mongoose = require("mongoose");
const logger = require("./logger");

/**
 * Tests the MongoDB connection with the provided URI
 * @param {string} uri - MongoDB connection URI
 * @returns {Promise<boolean>} - Resolves to true if connection successful
 */
const testConnection = async (uri) => {
  try {
    if (!uri) {
      logger.error("No MongoDB URI provided for connection test");
      return false;
    }

    // Create a separate connection for testing
    const testConn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Shorter timeout for test
      connectTimeoutMS: 5000,
    });

    // Close the test connection
    await testConn.close();
    logger.info("MongoDB connection validation successful");
    return true;
  } catch (err) {
    logger.error(`MongoDB connection validation failed: ${err.message}`);
    return false;
  }
};

/**
 * Get detailed information about the MongoDB connection
 * @param {string} uri - MongoDB connection URI
 * @returns {Object} - Connection details
 */
const getConnectionDetails = (uri) => {
  try {
    if (!uri) {
      return {
        type: "Unknown",
        hasCredentials: false,
        isValid: false,
        error: "No connection URI provided",
      };
    }

    // Parse URI without exposing credentials
    const isAtlas = uri.includes("mongodb+srv");
    const hasCredentials = uri.includes("@");

    return {
      type: isAtlas ? "MongoDB Atlas" : "MongoDB Server",
      hasCredentials,
      isValid: uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"),
    };
  } catch (error) {
    logger.error(`Error getting connection details: ${error.message}`);
    return {
      type: "Unknown",
      hasCredentials: false,
      isValid: false,
      error: error.message,
    };
  }
};

module.exports = {
  testConnection,
  getConnectionDetails,
};
