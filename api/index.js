// Simple API handler for Vercel
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Create Express app
const app = express();

// Configure middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(bodyParser.json());

// Default route handler
app.all("*", (req, res) => {
  console.log(`API request: ${req.method} ${req.url}`);

  // Return a response based on the path
  if (req.path.startsWith("/api/auth/")) {
    if (req.path === "/api/auth/me") {
      return res.status(200).json({
        success: true,
        data: {
          _id: "mock-user-id",
          username: "testuser",
          role: "admin",
          firstName: "Test",
          lastName: "User",
          languagePreference: "en",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Auth endpoint reached",
      path: req.path,
    });
  }

  return res.status(200).json({
    success: true,
    message: "API handler reached",
    method: req.method,
    path: req.path,
  });
});

// Export the serverless function handler
module.exports = (req, res) => {
  // Handle CORS preflight
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

  // Pass request to Express app
  return app(req, res);
};
