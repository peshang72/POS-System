#!/usr/bin/env node

/**
 * This script fixes missing dependencies in the server dist folder
 * Specifically targeting the express module issue on Windows builds
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔍 Checking for server dependencies...");

// Helper function to run a command and return its output
function runCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe", cwd }).trim();
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return "";
  }
}

// Get the electron directory
const electronDir = __dirname;
console.log("📦 Working in electron directory:", electronDir);

// Determine server directory
const serverDir = path.resolve(electronDir, "../server");
console.log("📦 Server directory:", serverDir);

// Determine server dist directory
const serverDistDir = path.resolve(serverDir, "dist");
console.log("📦 Server dist directory:", serverDistDir);

// Check if dist directory exists, create if not
if (!fs.existsSync(serverDistDir)) {
  console.log("📁 Creating server dist directory...");
  fs.mkdirSync(serverDistDir, { recursive: true });
}

// Copy package.json to dist directory if it doesn't exist
const serverPackageJson = path.join(serverDir, "package.json");
const distPackageJson = path.join(serverDistDir, "package.json");

if (!fs.existsSync(distPackageJson) && fs.existsSync(serverPackageJson)) {
  console.log("📄 Copying package.json to dist directory...");
  fs.copyFileSync(serverPackageJson, distPackageJson);

  // Also copy package-lock.json if it exists
  const serverPackageLock = path.join(serverDir, "package-lock.json");
  const distPackageLock = path.join(serverDistDir, "package-lock.json");

  if (fs.existsSync(serverPackageLock)) {
    console.log("📄 Copying package-lock.json to dist directory...");
    fs.copyFileSync(serverPackageLock, distPackageLock);
  }
}

// Define essential packages based on dependencies in package.json
let essentialPackages = [
  "express",
  "cors",
  "body-parser",
  "mongoose",
  "jsonwebtoken",
  "dotenv",
  "bcryptjs",
  "express-async-handler",
  "morgan",
  "passport",
  "passport-jwt",
  "winston",
];

// Try to read from package.json to get actual dependencies
try {
  if (fs.existsSync(distPackageJson)) {
    const packageData = require(distPackageJson);
    if (packageData.dependencies) {
      essentialPackages = Object.keys(packageData.dependencies);
      console.log(
        `📋 Found ${essentialPackages.length} dependencies in package.json`
      );
    }
  }
} catch (error) {
  console.error("⚠️ Error reading package.json:", error.message);
}

// Check if node_modules exists in the server dist directory
const nodeModulesDir = path.join(serverDistDir, "node_modules");
let modulesMissing = !fs.existsSync(nodeModulesDir);

// Also check if express specifically exists
const expressDir = path.join(nodeModulesDir, "express");
let expressMissing = !fs.existsSync(expressDir);

if (modulesMissing || expressMissing) {
  console.log(
    `❌ ${
      modulesMissing ? "Server node_modules missing" : "Express module missing"
    }! Installing dependencies...`
  );

  // Install server dependencies
  try {
    console.log("📦 Installing server dependencies in:", serverDistDir);

    // Remove existing node_modules to avoid conflicts
    if (fs.existsSync(nodeModulesDir)) {
      console.log("🧹 Removing existing node_modules...");
      fs.rmSync(nodeModulesDir, { recursive: true, force: true });
    }

    // First try using npm install
    console.log(
      "Running: npm install --production --no-optional --no-bin-links"
    );

    // Use spawnSync for better cross-platform compatibility
    const npmResult = spawnSync(
      "npm",
      ["install", "--production", "--no-optional", "--no-bin-links"],
      {
        cwd: serverDistDir,
        stdio: "inherit",
        shell: true,
      }
    );

    if (npmResult.status !== 0) {
      throw new Error("npm install failed");
    }
  } catch (error) {
    console.error("❌ Error installing dependencies with npm:", error.message);

    // Fallback to manual installation of essential packages
    console.log("🛠️ Attempting manual installation of essential packages...");

    // Create node_modules directory if it doesn't exist
    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    for (const pkg of essentialPackages) {
      console.log(`📦 Installing ${pkg}...`);
      try {
        spawnSync(
          "npm",
          ["install", "--save", "--no-optional", "--no-bin-links", pkg],
          {
            cwd: serverDistDir,
            stdio: "inherit",
            shell: true,
          }
        );
      } catch (err) {
        console.error(`❌ Failed to install ${pkg}:`, err.message);
      }
    }
  }
}

// Verify node_modules now exists
if (fs.existsSync(nodeModulesDir)) {
  console.log("✅ Server node_modules directory exists");

  // Check for essential modules
  const missingPackages = [];

  for (const pkg of essentialPackages) {
    const pkgDir = path.join(nodeModulesDir, pkg);
    if (!fs.existsSync(pkgDir)) {
      console.log(`❌ Missing essential package: ${pkg}`);
      missingPackages.push(pkg);
    } else {
      console.log(`✅ Found package: ${pkg}`);
    }
  }

  // Install any missing essential packages
  if (missingPackages.length > 0) {
    console.log("🛠️ Installing missing essential packages...");

    for (const pkg of missingPackages) {
      console.log(`📦 Installing ${pkg}...`);
      try {
        spawnSync(
          "npm",
          ["install", "--save", "--no-optional", "--no-bin-links", pkg],
          {
            cwd: serverDistDir,
            stdio: "inherit",
            shell: true,
          }
        );
      } catch (err) {
        console.error(`❌ Failed to install ${pkg}:`, err.message);
      }
    }
  }

  // Set proper permissions for node_modules (mainly for Linux/macOS)
  if (process.platform !== "win32") {
    console.log("🔑 Setting proper permissions for node_modules...");
    try {
      spawnSync("chmod", ["-R", "+r", nodeModulesDir], {
        stdio: "inherit",
        shell: true,
      });
    } catch (error) {
      console.warn(
        "⚠️ Could not set permissions on node_modules:",
        error.message
      );
    }
  }

  // Special case: Windows build directory
  // Check if there is a build directory with resources
  const buildDir = path.join(
    electronDir,
    "dist/win-unpacked/resources/server/dist"
  );
  if (fs.existsSync(buildDir)) {
    console.log("📁 Found build directory:", buildDir);

    // Create node_modules directory in build if it doesn't exist
    const buildNodeModules = path.join(buildDir, "node_modules");
    if (!fs.existsSync(buildNodeModules)) {
      console.log("📁 Creating node_modules in build directory...");
      fs.mkdirSync(buildNodeModules, { recursive: true });
    }

    // Copy node_modules to the build directory
    console.log("📦 Copying node_modules to build directory...");

    // Create a simple copy script for Windows compatibility
    const copyScriptPath = path.join(electronDir, "copy-modules.js");
    const copyScriptContent = `
      const fs = require('fs');
      const path = require('path');
      
      const sourceDir = '${nodeModulesDir.replace(/\\/g, "\\\\")}';
      const targetDir = '${buildNodeModules.replace(/\\/g, "\\\\")}';
      
      console.log('Copying from:', sourceDir);
      console.log('Copying to:', targetDir);
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy function
      function copyDir(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          try {
            if (entry.isDirectory()) {
              fs.mkdirSync(destPath, { recursive: true });
              copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          } catch (err) {
            console.error(\`Error copying \${srcPath} to \${destPath}: \${err.message}\`);
          }
        }
      }
      
      // Run the copy
      try {
        copyDir(sourceDir, targetDir);
        console.log('✅ Copy completed successfully!');
      } catch (err) {
        console.error('❌ Copy failed:', err);
      }
    `;

    fs.writeFileSync(copyScriptPath, copyScriptContent);
    console.log("📝 Created copy script");

    // Execute the copy script
    try {
      spawnSync("node", [copyScriptPath], {
        stdio: "inherit",
        shell: true,
      });
      console.log("✅ Node modules copied to build directory successfully");
    } catch (err) {
      console.error("❌ Failed to copy node modules:", err.message);
    }
  }
} else {
  console.error(
    "❌ Failed to install server dependencies! Node modules directory not found."
  );
}

console.log("🎉 Server dependencies fix process completed!");
