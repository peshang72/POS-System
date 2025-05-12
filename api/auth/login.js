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

// Simple login handler that logs raw request and returns mock data
module.exports = (req, res) => {
  // Log full request information for debugging
  console.log("Login handler invoked");
  console.log("HTTP method:", req.method);
  console.log("Request headers:", req.headers);

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

  // Parse the request body
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    console.log("Request body:", body);

    try {
      // Parse the JSON body
      const data = JSON.parse(body);
      console.log("Parsed body:", data);

      // Return a mock successful response
      return res.status(200).json({
        success: true,
        token: "debug-token-" + Date.now(),
        data: {
          _id: "mock-user-id",
          username: data.username || "user",
          role: "admin",
          firstName: "Test",
          lastName: "User",
          languagePreference: "en",
        },
      });
    } catch (err) {
      console.error("Error parsing request body:", err);
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }
  });
};
