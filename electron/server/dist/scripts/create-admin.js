const mongoose = require("mongoose");
const User = require("../models/user.model");
const config = require("../config");
const logger = require("../utils/logger");

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI);
    logger.info("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: "admin1" });

    if (existingAdmin) {
      logger.info("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      username: "admin1",
      password: "admin123", // This will be hashed by the User model pre-save hook
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin1@listik.app",
      phone: "07501234554", // Add a phone number to avoid the unique index error
      active: true,
      languagePreference: "en",
    });

    logger.info(`Admin user created with ID: ${adminUser._id}`);
    logger.info("Username: admin, Password: admin123");
    logger.info("Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    logger.error("Error creating admin user:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

createAdminUser();
