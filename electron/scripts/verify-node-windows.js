/**
 * Script to verify that Node.js is properly included in the build
 * Run this after download-node-windows.js and before packaging
 */
const fs = require("fs");
const path = require("path");

// Paths where node.exe should be located
const NODE_PATHS = [
  path.join(__dirname, "..", "resources", "node.exe"),
  path.join(__dirname, "..", "extraResources", "node.exe"),
  path.join(__dirname, "..", "assets", "node.exe"),
];

// Minimum acceptable file size for node.exe (in bytes)
// Node.exe is typically ~30MB, so anything much smaller is suspect
const MIN_SIZE = 10000000; // 10MB

console.log("🔍 Verifying Node.js for Windows bundling");
console.log("===========================================");

let foundNodeExe = false;
let foundValidSize = false;
let detailedResults = [];

// Check each potential location
for (const nodePath of NODE_PATHS) {
  try {
    if (fs.existsSync(nodePath)) {
      const stats = fs.statSync(nodePath);
      const fileSize = stats.size;
      foundNodeExe = true;

      detailedResults.push({
        path: nodePath,
        exists: true,
        size: fileSize,
        valid: fileSize >= MIN_SIZE,
      });

      if (fileSize >= MIN_SIZE) {
        foundValidSize = true;
      }
    } else {
      detailedResults.push({
        path: nodePath,
        exists: false,
        size: 0,
        valid: false,
      });
    }
  } catch (error) {
    detailedResults.push({
      path: nodePath,
      exists: false,
      error: error.message,
      valid: false,
    });
  }
}

// Print detailed results
console.log("Node.js Verification Results:");
console.log("-----------------------------");

for (const result of detailedResults) {
  if (result.exists) {
    const sizeInMB = (result.size / 1024 / 1024).toFixed(2);
    if (result.valid) {
      console.log(`✅ ${result.path} - ${sizeInMB} MB (VALID)`);
    } else {
      console.log(
        `❌ ${result.path} - ${sizeInMB} MB (TOO SMALL - likely corrupt)`
      );
    }
  } else {
    console.log(
      `❌ ${result.path} - NOT FOUND${
        result.error ? ` (Error: ${result.error})` : ""
      }`
    );
  }
}

// Overall verification status
console.log("\nVerification Summary:");
console.log("---------------------");

if (foundNodeExe) {
  if (foundValidSize) {
    console.log("✅ SUCCESS: Found valid Node.js executable(s)");
    console.log("🚀 Build can proceed!");
    process.exit(0);
  } else {
    console.log(
      "⚠️ WARNING: Found Node.js executable(s) but all are suspiciously small"
    );
    console.log("   This may indicate corrupt downloads or incomplete files");
    console.log("   Recommend re-running npm run download-node-windows");
    // Exit with warning but don't fail the build
    process.exit(0);
  }
} else {
  console.log(
    "❌ FAILURE: No Node.js executable found in any expected location"
  );
  console.log(
    "   This will cause the application to fail when starting the server"
  );
  console.log("   Please run npm run download-node-windows before building");
  // Exit with error code to fail the build
  process.exit(1);
}
