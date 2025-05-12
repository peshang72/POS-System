// Serverless function for /api/auth/login
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Try to load environment variables from server/.env
try {
  // Check various possible paths for the .env file
  const possiblePaths = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "server", ".env"),
    path.join(process.cwd(), "..", "server", ".env"),
  ];

  console.log("Current working directory:", process.cwd());
  console.log("Checking for .env file in the following paths:");

  let envLoaded = false;
  for (const envPath of possiblePaths) {
    console.log(`- Checking: ${envPath}`);
    if (fs.existsSync(envPath)) {
      console.log(`Found .env file at: ${envPath}`);
      dotenv.config({ path: envPath });
      envLoaded = true;
      break;
    }
  }

  if (!envLoaded) {
    console.log("No .env file found in any of the checked paths");
  }
} catch (err) {
  console.error("Error loading .env file:", err);
}

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      // Log environment variables for debugging (Vercel logs)
      console.log("Environment check:");
      console.log("NODE_ENV:", process.env.NODE_ENV);
      console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

      // Use environment variable first
      const mongoURI = process.env.MONGO_URI;

      if (!mongoURI) {
        console.error(
          "CRITICAL ERROR: No MongoDB URI provided in environment variables"
        );
        return {
          success: false,
          error: "No MongoDB connection string found in environment variables",
        };
      }

      // Log a redacted version of the connection string for debugging
      const redactedURI = mongoURI.replace(
        /(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/,
        "$1***:***@"
      );
      console.log("Connecting to MongoDB:", redactedURI);

      try {
        await mongoose.connect(mongoURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000, // Longer timeout for Vercel
        });
        console.log(
          "MongoDB connected successfully in login serverless function"
        );
        return { success: true };
      } catch (connErr) {
        console.error("MongoDB connection error details:", connErr);
        return {
          success: false,
          error: `Connection error: ${connErr.message}`,
          stack: connErr.stack,
        };
      }
    } catch (err) {
      console.error("Outer MongoDB setup error:", err.message);
      return {
        success: false,
        error: `Setup error: ${err.message}`,
        stack: err.stack,
      };
    }
  }
  return { success: true };
};

// Define User Schema for this serverless function
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "manager", "cashier"],
    required: true,
    default: "cashier",
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  active: { type: Boolean, default: true },
  languagePreference: { type: String, enum: ["en", "ku"], default: "en" },
});

// Match password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create User model if it doesn't exist
let User;
try {
  User = mongoose.model("User");
} catch {
  User = mongoose.model("User", UserSchema);
}

// Login handler
module.exports = async (req, res) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    );
    return res.status(200).end();
  }

  // Only allow POST method for this endpoint
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed for this endpoint`,
    });
  }

  try {
    // Connect to database with improved error handling
    const connectionResult = await connectDB();
    if (!connectionResult.success) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        details: connectionResult.error,
        stack:
          process.env.NODE_ENV === "development"
            ? connectionResult.stack
            : undefined,
      });
    }

    // Get username and password from request body
    const { username, password } = req.body;

    // Validate input data
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }

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
      { id: user._id },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: process.env.JWT_EXPIRE || "1d" }
    );

    // Return success response
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
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message,
    });
  }
};
