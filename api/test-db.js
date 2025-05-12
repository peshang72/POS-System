// Simple MongoDB connection test for Vercel
const mongoose = require("mongoose");

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Return environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriStart: process.env.MONGO_URI
        ? process.env.MONGO_URI.substring(0, 15) + "..."
        : "not set",
      cwd: process.cwd(),
      files: {},
    };

    // Try to connect to MongoDB
    if (process.env.MONGO_URI) {
      try {
        await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });

        const connectionStatus = mongoose.connection.readyState;
        const status = {
          0: "disconnected",
          1: "connected",
          2: "connecting",
          3: "disconnecting",
        };

        // Return success with connection info
        return res.status(200).json({
          success: true,
          message: "Database connection test",
          environment: envInfo,
          connection: {
            status: status[connectionStatus] || "unknown",
            readyState: connectionStatus,
          },
        });
      } catch (dbError) {
        // Return DB connection error
        return res.status(500).json({
          success: false,
          message: "Database connection failed",
          error: dbError.message,
          stack: dbError.stack,
          environment: envInfo,
        });
      }
    } else {
      // Return no connection string error
      return res.status(500).json({
        success: false,
        message: "No MongoDB URI provided in environment variables",
        environment: envInfo,
      });
    }
  } catch (err) {
    // Return general error
    return res.status(500).json({
      success: false,
      message: "Error during database test",
      error: err.message,
      stack: err.stack,
    });
  }
};
