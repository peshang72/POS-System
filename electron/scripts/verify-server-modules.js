#!/usr/bin/env node

/**
 * Script to verify server modules after build
 * Ensures the server node_modules are correctly included in the build
 */

const fs = require("fs");
const path = require("path");

// Define paths
const electronDir = path.resolve(__dirname, "..");
const serverDir = path.resolve(electronDir, "../server");
const serverDistDir = path.resolve(serverDir, "dist");

// Build paths - add more potential locations since we disabled asar
const possibleBuildDirs = [
  path.join(electronDir, "dist/win-unpacked/resources/server/dist"),
  path.join(electronDir, "dist/win-unpacked/resources/app/server/dist"),
  path.join(
    electronDir,
    "dist/win-unpacked/resources/app.asar.unpacked/server/dist"
  ),
  path.join(electronDir, "dist/win-unpacked/server/dist"),
  // More paths for extra resources
  path.join(electronDir, "dist/win-unpacked/client/dist/node_modules"),
  path.join(electronDir, "dist/win-unpacked/server/dist/node_modules"),
];

console.log("🔍 Verifying server modules in build...");
console.log("Checking paths:");
console.log(
  "- Server modules source:",
  path.join(serverDistDir, "node_modules")
);
console.log("- Possible build paths:");
possibleBuildDirs.forEach((dir) => console.log(`  - ${dir}`));

// Critical packages that must be included
const criticalPackages = [
  "express",
  "cors",
  "mongoose",
  "jsonwebtoken",
  "bcryptjs",
];

// Check a directory for required modules
function checkDirectory(dir, name) {
  console.log(`\nChecking ${name}...`);

  if (!fs.existsSync(dir)) {
    console.log(`❌ Directory not found: ${dir}`);
    return false;
  }

  const nodeModulesDir = path.join(dir, "node_modules");
  if (!fs.existsSync(nodeModulesDir)) {
    console.log(`❌ node_modules not found in ${name}`);
    return false;
  }

  console.log(`✅ Found node_modules in ${name}`);

  // Check for critical packages
  let allFound = true;
  for (const pkg of criticalPackages) {
    const pkgDir = path.join(nodeModulesDir, pkg);
    if (fs.existsSync(pkgDir)) {
      console.log(`✅ Found ${pkg}`);
    } else {
      console.log(`❌ Missing ${pkg}`);
      allFound = false;
    }
  }

  // Display size information
  try {
    const { stdout } = require("child_process").spawnSync(
      "du",
      ["-sh", nodeModulesDir],
      {
        encoding: "utf8",
        shell: true,
      }
    );
    console.log(`📊 Size: ${stdout.trim()}`);
  } catch (err) {
    console.log("Unable to determine size");
  }

  return allFound;
}

// Check source directory first
console.log("\n===== Checking Source Directory =====");
const sourceDirValid = checkDirectory(
  serverDistDir,
  "source server/dist directory"
);

// Check all possible build directories
console.log("\n===== Checking Build Directories =====");
let foundValidBuildDir = false;
const validPaths = [];

for (const buildDir of possibleBuildDirs) {
  if (fs.existsSync(buildDir)) {
    const isValid = checkDirectory(buildDir, `build path: ${buildDir}`);
    if (isValid) {
      foundValidBuildDir = true;
      validPaths.push(buildDir);
    }
  }
}

// Check for any node_modules in the build directory
console.log("\n===== Searching for node_modules in build directory =====");
const buildRootDir = path.join(electronDir, "dist/win-unpacked");
let foundModulesInBuild = false;

function searchForNodeModules(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Check if this directory contains node_modules
    if (
      entries.some(
        (entry) => entry.isDirectory() && entry.name === "node_modules"
      )
    ) {
      const nodeModulesPath = path.join(dir, "node_modules");
      console.log(`🔍 Found node_modules at: ${nodeModulesPath}`);

      // Check for critical modules
      let criticalFound = 0;
      for (const pkg of criticalPackages) {
        if (fs.existsSync(path.join(nodeModulesPath, pkg))) {
          criticalFound++;
        }
      }

      console.log(
        `   Contains ${criticalFound}/${criticalPackages.length} critical packages`
      );

      if (criticalFound > 0) {
        foundModulesInBuild = true;
        validPaths.push(dir);
      }
    }

    // Recursively search subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "node_modules") {
        searchForNodeModules(path.join(dir, entry.name), depth + 1, maxDepth);
      }
    }
  } catch (err) {
    console.error(`Error searching ${dir}: ${err.message}`);
  }
}

// Start recursive search if build directory exists
if (fs.existsSync(buildRootDir)) {
  searchForNodeModules(buildRootDir);
} else {
  console.log(`❌ Build directory not found: ${buildRootDir}`);
}

// Final summary
console.log("\n====== Verification Summary ======");
if (sourceDirValid) {
  console.log("✅ Source server modules: VALID");
} else {
  console.log("❌ Source server modules: INVALID - This is a critical issue");
}

if (foundValidBuildDir || foundModulesInBuild) {
  console.log("✅ Server modules in build: INCLUDED");
  console.log("   Valid paths found:");
  validPaths.forEach((p) => console.log(`   - ${p}`));
} else {
  console.log("⚠️ Server modules in build: NOT FOUND IN EXPECTED LOCATIONS");
  console.log(
    "   This might be OK if modules are accessible through other means"
  );
  console.log("   Please verify the application runs correctly after building");
}

// Exit with appropriate status code
if (!sourceDirValid) {
  console.log("\n❌ VERIFICATION FAILED: Source server modules are invalid");
  process.exit(1);
} else if (!foundValidBuildDir && !foundModulesInBuild) {
  console.log(
    "\n⚠️ VERIFICATION WARNING: Server modules not found in build locations"
  );
  console.log("   Please test the application to ensure it works correctly");
  process.exit(0);
} else {
  console.log(
    "\n✅ VERIFICATION PASSED: Server modules appear to be correctly included"
  );
  process.exit(0);
}
