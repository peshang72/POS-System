const express = require("express");
const path = require("path");
const http = require("http");
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

// Middleware to handle request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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

// Forward API requests to backend server (running on port 5000)
app.use("/api", (req, res) => {
  console.log(`[PROXY] Forwarding ${req.method} ${req.url} to API server`);

  // Options for the proxy request
  const options = {
    hostname: LOCAL_IP, // Use our local IP to ensure connectivity
    port: 5000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${LOCAL_IP}:5000`,
    },
  };

  console.log(`[PROXY] Request to: http://${LOCAL_IP}:5000${req.url}`);

  // Create the proxy request
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[PROXY] Response status: ${proxyRes.statusCode}`);

    res.statusCode = proxyRes.statusCode;
    Object.keys(proxyRes.headers).forEach((key) => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    // Log response body for debugging
    let responseData = "";
    proxyRes.on("data", (chunk) => {
      responseData += chunk;
    });

    proxyRes.on("end", () => {
      try {
        const jsonData = JSON.parse(responseData);
        console.log(
          `[PROXY] Response: ${JSON.stringify(jsonData).substring(0, 200)}...`
        );
      } catch (e) {
        console.log(
          `[PROXY] Response data (not JSON): ${responseData.substring(
            0,
            100
          )}...`
        );
      }

      // Send the response to the client
      res.end(responseData);
    });
  });

  // Handle proxy request errors
  proxyReq.on("error", (e) => {
    console.error(`[PROXY] Error: ${e.message}`);
    res.status(500).send(`Error connecting to API server: ${e.message}`);
  });

  // Log request body
  let requestBody = "";
  req.on("data", (chunk) => {
    requestBody += chunk;
  });

  req.on("end", () => {
    if (requestBody) {
      try {
        const jsonBody = JSON.parse(requestBody);
        console.log(`[PROXY] Request body: ${JSON.stringify(jsonBody)}`);
        proxyReq.write(requestBody);
      } catch (e) {
        console.log(`[PROXY] Request body (not JSON): ${requestBody}`);
        proxyReq.write(requestBody);
      }
    }
    proxyReq.end();
  });
});

// For any other routes, serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Client server running on http://0.0.0.0:${PORT}`);
  console.log(
    `Access from other devices on your network at http://${LOCAL_IP}:${PORT}`
  );
  console.log(`API server should be running on http://${LOCAL_IP}:5000`);
});
