// Serverless function for /api/auth/login
const express = require("express");
const app = require("../index");

// Export the handler function
module.exports = (req, res) => {
  if (req.method === "OPTIONS") {
    // Handle CORS preflight request
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    // Return 405 Method Not Allowed if not POST
    res.status(405).json({
      success: false,
      message:
        "Method not allowed. Only POST requests are supported for this endpoint.",
    });
    return;
  }

  // Pass the request to the Express app
  app(req, res);
};
