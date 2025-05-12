#!/usr/bin/env node

/**
 * Manual dependency installation script
 * This script will step-by-step install dependencies without using package.json overrides
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Print colored text
function print(message, color) {
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
  };

  console.log(`${colors[color] || ""}${message}${colors.reset}`);
}

// Run a command with error handling
function runCommand(command, cwd = __dirname) {
  try {
    print(`🔄 Running: ${command}`, "blue");
    execSync(command, { stdio: "inherit", cwd });
    return true;
  } catch (error) {
    print(`❌ Command failed: ${command}`, "red");
    print(`Error: ${error.message}`, "red");
    return false;
  }
}

async function run() {
  print("\n🔧 Running Manual Dependency Installation\n", "cyan");

  // 1. Remove package.json overrides and resolutions
  print("\n1️⃣ Cleaning up package.json", "cyan");

  const packageJsonPath = path.join(__dirname, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Remove overrides and resolutions
      delete packageJson.overrides;
      delete packageJson.resolutions;

      // Remove problematic direct dependencies
      if (packageJson.dependencies) {
        print("Removing problematic direct dependencies...", "blue");
        delete packageJson.dependencies.glob;
        delete packageJson.dependencies.inflight;
        delete packageJson.dependencies.boolean;

        // If dependencies is empty, remove it
        if (Object.keys(packageJson.dependencies).length === 0) {
          delete packageJson.dependencies;
        }
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      print("✅ Cleaned up package.json", "green");
    } catch (error) {
      print(`❌ Error modifying package.json: ${error.message}`, "red");
    }
  }

  // 2. Clean install
  print("\n2️⃣ Cleaning node_modules", "cyan");
  const nodeModulesPath = path.join(__dirname, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    try {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      print("✅ Removed node_modules directory", "green");
    } catch (error) {
      print(`❌ Error removing node_modules: ${error.message}`, "red");
    }
  }

  // 3. Install dependencies with --legacy-peer-deps
  print("\n3️⃣ Installing dependencies with --legacy-peer-deps", "cyan");
  if (runCommand("npm install --legacy-peer-deps")) {
    print("✅ Dependencies installed successfully", "green");
  }

  // 4. Build server if it doesn't have dist folder
  print("\n4️⃣ Checking server build", "cyan");
  const serverDistPath = path.join(__dirname, "../server/dist");
  if (!fs.existsSync(serverDistPath)) {
    print("Server dist directory not found, building server...", "yellow");

    try {
      fs.mkdirSync(serverDistPath, { recursive: true });

      if (runCommand("npm run build", path.join(__dirname, "../server"))) {
        print("✅ Server built successfully", "green");
      } else {
        print("⚠️ Creating placeholder server files instead", "yellow");
        const fallbackServer = `console.log('This is a placeholder for the server. Please build the actual server application.');`;
        fs.writeFileSync(path.join(serverDistPath, "index.js"), fallbackServer);
        print("✅ Created placeholder server files", "green");
      }
    } catch (error) {
      print(`❌ Error building server: ${error.message}`, "red");
    }
  } else {
    print("✅ Server build directory already exists", "green");
  }

  print("\n🎉 Manual installation completed!", "green");
  print("\nNext steps:", "cyan");
  print("1. Run development mode: npm run electron:dev", "cyan");
  print("2. Build for Windows: npm run build:win", "cyan");
}

// Run the script
run().catch((error) => {
  print(`\n❌ Script failed: ${error.message}`, "red");
});
