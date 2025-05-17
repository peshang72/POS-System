/**
 * Script to download Node.js for Windows only if it doesn't already exist
 * This prevents redundant downloads in the build process
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Paths where node.exe should be located
const NODE_PATHS = [
  path.join(__dirname, "..", "resources", "node.exe"),
  path.join(__dirname, "..", "extraResources", "node.exe"),
  path.join(__dirname, "..", "assets", "node.exe"),
];

// Minimum acceptable file size for node.exe (in bytes)
const MIN_SIZE = 10000000; // 10MB

function checkForValidNodeExe() {
  for (const nodePath of NODE_PATHS) {
    if (fs.existsSync(nodePath)) {
      const stats = fs.statSync(nodePath);
      if (stats.size >= MIN_SIZE) {
        return true;
      }
    }
  }
  return false;
}

// Main function
function main() {
  console.log("🔍 Checking if Node.js for Windows is already downloaded...");

  if (checkForValidNodeExe()) {
    console.log("✅ Valid Node.js executable found. Skipping download.");
    console.log("Locations:");
    for (const path of NODE_PATHS) {
      if (fs.existsSync(path)) {
        console.log(`✅ ${path} - ${fs.statSync(path).size} bytes`);
      }
    }
    return;
  }

  console.log("⚠️ No valid Node.js executable found. Downloading now...");

  // Run the download script
  const result = spawnSync(
    "node",
    [path.join(__dirname, "download-node-windows.js")],
    {
      stdio: "inherit",
    }
  );

  if (result.status !== 0) {
    console.error("❌ Failed to download Node.js");
    process.exit(1);
  }

  console.log("✅ Node.js downloaded successfully");
}

// Run the main function
main();
