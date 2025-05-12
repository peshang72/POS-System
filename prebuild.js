#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Running prebuild verification...");

// Verify client directory exists
const clientDir = path.join(__dirname, "client");
if (!fs.existsSync(clientDir)) {
  console.error("Client directory not found!");
  process.exit(1);
}

// Check if vite is installed in client directory
try {
  console.log("Ensuring Vite is installed...");

  // Make sure we're using a compatible version of Vite
  execSync(
    "cd client && npm install vite@5.1.5 @vitejs/plugin-react@4.2.1 --save-dev",
    {
      stdio: "inherit",
      encoding: "utf-8",
    }
  );

  console.log("Vite installation verified!");

  // Verify vite config exists
  const viteConfigPath = path.join(clientDir, "vite.config.js");
  if (!fs.existsSync(viteConfigPath)) {
    console.error("Vite config file not found!");
    process.exit(1);
  }

  console.log("Prebuild verification complete!");
} catch (error) {
  console.error("Error during prebuild verification:", error.message);
  process.exit(1);
}
