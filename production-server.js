const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const app = express();
const PORT = process.env.CLIENT_PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

// Get the local IP address for better network display
const getLocalIp = () => {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  let localIp = null;

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        if (!localIp) {
          localIp = net.address;
        }
      }
    }
  }
  return localIp || "localhost";
};

const LOCAL_IP = getLocalIp();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Set up API proxy
app.use(
  "/api",
  createProxyMiddleware({
    target: `http://${LOCAL_IP}:${API_PORT}`,
    changeOrigin: true,
    pathRewrite: {
      "^/api": "/api",
    },
    logLevel: "error",
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && req.method !== "GET") {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error connecting to API server",
          error: err.message,
        });
      }
    },
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "client/dist")));

// Catch-all route handler for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log("=== POS System Production Server ===");
  console.log(`Client UI: http://${LOCAL_IP}:${PORT}`);
  console.log(`API Server: http://${LOCAL_IP}:${API_PORT}`);
  console.log("");
  console.log("Access from any device on your network:");
  console.log(`http://${LOCAL_IP}:${PORT}`);
});
