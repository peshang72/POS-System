const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const app = express();
const PORT = process.env.PORT || 3000;

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get the local IP address for better network access info
const getLocalIpAddress = () => {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();

  let localIp = null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        if (!localIp) {
          localIp = net.address;
        }
      }
    }
  }
  return localIp || "localhost";
};

const localIp = getLocalIpAddress();
const API_SERVER_HOST = process.env.API_SERVER_HOST || localIp;
const API_SERVER_PORT = process.env.API_SERVER_PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the client/dist directory
app.use(express.static(path.join(__dirname, "client/dist")));

// Basic proxy middleware for API requests
app.use("/api", (req, res) => {
  const options = {
    hostname: API_SERVER_HOST,
    port: API_SERVER_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${API_SERVER_HOST}:${API_SERVER_PORT}`,
    },
  };

  console.log(
    `Proxying ${req.method} ${req.url} → http://${API_SERVER_HOST}:${API_SERVER_PORT}${req.url}`
  );

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err);
    res.status(500).json({
      error: "API server connection error",
      details: err.message,
    });
  });

  if (req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }

  req.pipe(proxyReq, { end: true });
});

// Handle all other routes by serving the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Client app is running on http://0.0.0.0:${PORT}`);
  console.log(`Access this URL from other devices on your network`);

  if (localIp) {
    console.log(`To access from other devices use: http://${localIp}:${PORT}`);
    console.log(
      `API server is configured at: http://${API_SERVER_HOST}:${API_SERVER_PORT}`
    );
  }
});
