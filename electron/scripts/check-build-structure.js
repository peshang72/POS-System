#!/usr/bin/env node

/**
 * Script to analyze the build structure
 * This helps diagnose issues with finding files and modules in the build
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const electronDir = path.resolve(__dirname, "..");
const buildDir = path.resolve(electronDir, "dist/win-unpacked");

console.log("🔍 Analyzing build structure...");
console.log(`Build directory: ${buildDir}`);

if (!fs.existsSync(buildDir)) {
  console.error("❌ Build directory does not exist. Run a build first.");
  process.exit(1);
}

// Function to recursively list directories with key files
function exploreDirectory(dir, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return;

  const indent = "  ".repeat(depth);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Check for important files
  const hasPackageJson = entries.some(
    (e) => e.isFile() && e.name === "package.json"
  );
  const hasNodeModules = entries.some(
    (e) => e.isDirectory() && e.name === "node_modules"
  );
  const hasIndexJs = entries.some((e) => e.isFile() && e.name === "index.js");
  const hasNodeExe = entries.some((e) => e.isFile() && e.name === "node.exe");

  // Mark important directories
  let importance = "";
  if (hasPackageJson) importance += "📄";
  if (hasNodeModules) importance += "📦";
  if (hasIndexJs) importance += "🚀";
  if (hasNodeExe) importance += "⚙️";

  const relativePath = path.relative(buildDir, dir);
  console.log(`${indent}${relativePath || "."} ${importance}`);

  if (hasNodeModules) {
    try {
      // List number of modules
      const moduleCount = fs.readdirSync(path.join(dir, "node_modules")).length;
      console.log(`${indent}  📦 ${moduleCount} modules`);

      // Check for critical modules
      const criticalModules = [
        "express",
        "cors",
        "mongoose",
        "jsonwebtoken",
        "bcryptjs",
      ];
      const foundModules = criticalModules.filter((mod) =>
        fs.existsSync(path.join(dir, "node_modules", mod))
      );

      if (foundModules.length > 0) {
        console.log(`${indent}  ✅ Found: ${foundModules.join(", ")}`);
      }

      // Get size
      try {
        const output = execSync(`du -sh "${path.join(dir, "node_modules")}"`, {
          encoding: "utf8",
        });
        console.log(`${indent}  📊 Size: ${output.trim()}`);
      } catch (err) {
        // Ignore size error
      }
    } catch (err) {
      console.log(`${indent}  ❌ Error reading node_modules: ${err.message}`);
    }
  }

  // Continue recursion for directories only
  const directories = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== "node_modules"
  );

  for (const entry of directories) {
    exploreDirectory(path.join(dir, entry.name), depth + 1, maxDepth);
  }
}

// Look for unpacked modules specifically
function checkUnpackedModules() {
  console.log("\n🔍 Checking for unpacked modules...");
  const unpackDir = path.join(buildDir, "resources", "app.asar.unpacked");

  if (!fs.existsSync(unpackDir)) {
    console.log("❌ No unpacked resources found at: " + unpackDir);
    return false;
  }

  console.log("✅ Found unpacked resources at: " + unpackDir);

  // Check for critical server modules
  const criticalModules = [
    "express",
    "cors",
    "mongoose",
    "jsonwebtoken",
    "bcryptjs",
  ];

  const serverModulesPath = path.join(unpackDir, "server/dist/node_modules");
  let foundModulesCount = 0;

  criticalModules.forEach((module) => {
    const modulePath = path.join(serverModulesPath, module);
    if (fs.existsSync(modulePath)) {
      console.log(`✅ Found unpacked module: ${module}`);
      foundModulesCount++;
    } else {
      console.log(`❓ Unpacked module not found: ${module}`);
    }
  });

  console.log(
    `Found ${foundModulesCount}/${criticalModules.length} unpacked modules`
  );
  return foundModulesCount > 0;
}

// Check for node.exe
function checkNodeExe() {
  console.log("\n🔍 Checking for node.exe...");

  const possibleLocations = [
    path.join(buildDir, "node.exe"),
    path.join(buildDir, "resources", "node.exe"),
    path.join(buildDir, "resources", "app.asar.unpacked", "node.exe"),
  ];

  for (const loc of possibleLocations) {
    if (fs.existsSync(loc)) {
      console.log(`✅ Found node.exe at: ${loc}`);
      const stats = fs.statSync(loc);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   Size: ${sizeMB} MB`);
      return true;
    }
  }

  console.log("❌ node.exe not found in expected locations");
  return false;
}

// Start exploration
console.log("\n📂 Build directory structure (with important files):\n");
console.log(
  "Legend: 📄=package.json 📦=node_modules 🚀=index.js ⚙️=node.exe\n"
);
exploreDirectory(buildDir);

// Check the ASAR file
const asarFile = path.join(buildDir, "resources", "app.asar");
if (fs.existsSync(asarFile)) {
  console.log("\n📦 Found app.asar file:");

  try {
    // Show asar size
    const stats = fs.statSync(asarFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  Size: ${sizeMB} MB`);

    // Try to list asar contents if asar CLI is available
    try {
      const asarList = execSync(
        `npx asar list "${asarFile}" | grep "node_modules" | head -10`,
        {
          encoding: "utf8",
        }
      );
      console.log("  Sample module paths in asar:");
      console.log(asarList);
    } catch (err) {
      console.log(
        "  Could not list asar contents. Install asar globally for more info."
      );
    }
  } catch (err) {
    console.error(`  Error examining ASAR file: ${err.message}`);
  }
} else {
  console.log("\n❌ No app.asar file found");
}

// Check for unpacked asar content
const unpackedAsarDir = path.join(buildDir, "resources", "app.asar.unpacked");
if (fs.existsSync(unpackedAsarDir)) {
  console.log("\n📦 Found app.asar.unpacked directory:");

  try {
    // Show size
    const { stdout } = execSync(`du -sh "${unpackedAsarDir}"`, {
      encoding: "utf8",
    });
    console.log(`  Size: ${stdout.trim()}`);

    // List top-level directories
    const entries = fs.readdirSync(unpackedAsarDir, { withFileTypes: true });
    console.log("  Top level entries:");
    entries.forEach((entry) => {
      console.log(
        `    - ${entry.name} ${entry.isDirectory() ? "(dir)" : "(file)"}`
      );
    });
  } catch (err) {
    console.error(`  Error examining unpacked directory: ${err.message}`);
  }
} else {
  console.log(
    "\n❓ No app.asar.unpacked directory found. This may be a problem if you need unpacked files."
  );
}

// Check for specific requirements
const hasUnpackedModules = checkUnpackedModules();
const hasNodeExe = checkNodeExe();

// Final summary
console.log("\n===== Build Structure Analysis Summary =====");
console.log(
  `✅ ASAR packaging: ${fs.existsSync(asarFile) ? "Enabled" : "Disabled"}`
);
console.log(
  `${hasUnpackedModules ? "✅" : "⚠️"} Unpacked modules: ${
    hasUnpackedModules ? "Found" : "Not found or incomplete"
  }`
);
console.log(
  `${hasNodeExe ? "✅" : "❌"} Node.exe: ${hasNodeExe ? "Found" : "Not found"}`
);

console.log("\n✅ Build structure analysis complete");
if (!hasUnpackedModules || !hasNodeExe) {
  console.log("\n⚠️ WARNING: Some required components might be missing.");
  console.log("   Your application may not work correctly.");
  console.log(
    "   Consider adjusting your asarUnpack settings to include missing components."
  );
}
