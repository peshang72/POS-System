const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Get the local IP address
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

// Add CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, "client/dist")));

// For any other routes, serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Basic server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from other devices at http://${LOCAL_IP}:${PORT}`);
  console.log(
    "NOTE: This server only serves static files. API functionality will not work."
  );
});
