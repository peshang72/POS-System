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

// Minimal login handler for debugging
module.exports = (req, res) => {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed. Only POST requests are supported.`,
    });
  }

  // Return a mock successful response
  return res.status(200).json({
    success: true,
    token: "debug-token",
    data: {
      _id: "debug-id",
      username: "debug-user",
      role: "admin",
    },
  });
};
