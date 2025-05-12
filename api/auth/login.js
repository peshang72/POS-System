// Serverless function for /api/auth/login
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("../../server/src/config");

// For direct serverless function implementation, define minimal requirements
const app = express();
app.use(cors());
app.use(express.json());

// Connect to database for Vercel deployment
const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI || config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected in serverless function");
    } catch (err) {
      console.error("MongoDB connection error:", err.message);
      return false;
    }
  }
  return true;
};

// Export the handler function
module.exports = async (req, res) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message:
        "Method not allowed. Only POST requests are supported for this endpoint.",
    });
  }

  try {
    // Connect to database
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }

    // Import User model here to ensure it's loaded after mongoose connection
    const User = require("../../server/src/models/user.model");
    const StaffActivity = require("../../server/src/models/staffActivity.model");

    // Check for user
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact an administrator",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret || process.env.JWT_SECRET,
      { expiresIn: config.jwtExpire || "30d" }
    );

    // Log activity
    try {
      await StaffActivity.create({
        staff: user._id,
        actionType: "login",
        details: {
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Failed to log staff activity:", err.message);
      // Continue anyway - this is not critical
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        languagePreference: user.languagePreference,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};
