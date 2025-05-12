#!/usr/bin/env node

/**
 * Simple setup script for Electron app
 * This script will set up the Electron application environment
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
    magenta: "\x1b[35m",
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

// Run the setup
async function run() {
  print("Starting Electron setup...", "cyan");

  // 1. Check directories
  print("Checking project structure...", "blue");
  const rootDir = path.join(__dirname, "..");
  const clientDir = path.join(rootDir, "client");
  const serverDir = path.join(rootDir, "server");

  if (!fs.existsSync(clientDir)) {
    print(`❌ Client directory not found: ${clientDir}`, "red");
    return false;
  }

  if (!fs.existsSync(serverDir)) {
    print(`❌ Server directory not found: ${serverDir}`, "red");
    return false;
  }

  // Ensure server package.json has the build script
  try {
    const serverPackageJsonPath = path.join(serverDir, "package.json");
    if (fs.existsSync(serverPackageJsonPath)) {
      const serverPackageJson = JSON.parse(
        fs.readFileSync(serverPackageJsonPath, "utf8")
      );
      if (!serverPackageJson.scripts || !serverPackageJson.scripts.build) {
        print(
          "⚠️ Server package.json is missing the build script. Adding it...",
          "yellow"
        );
        serverPackageJson.scripts = serverPackageJson.scripts || {};
        serverPackageJson.scripts.build = "mkdir -p dist && cp -r src/* dist/";
        fs.writeFileSync(
          serverPackageJsonPath,
          JSON.stringify(serverPackageJson, null, 2)
        );
        print("✅ Added build script to server package.json", "green");
      }
    }
  } catch (error) {
    print(
      `⚠️ Warning checking server package.json: ${error.message}`,
      "yellow"
    );
    print("Continuing anyway...", "yellow");
  }

  print("✅ Project structure looks good", "green");

  // 2. Run manual install script (which is more reliable)
  print("Installing dependencies using manual setup script...", "blue");
  try {
    // Run the manual-install.js script directly
    if (runCommand("node manual-install.js")) {
      print("✅ Installation completed successfully", "green");
    } else {
      print("❌ Installation failed", "red");
      return false;
    }
  } catch (error) {
    print(`❌ Installation error: ${error.message}`, "red");
    return false;
  }

  print("\n🎉 Setup completed successfully!", "green");
  print("\nNext steps:", "cyan");
  print("1. Run development mode: npm run electron:dev", "cyan");
  print("2. Build for Windows: npm run build:win", "cyan");

  return true;
}

// Run the setup
run().catch((error) => {
  print(`❌ Setup failed: ${error.message}`, "red");
  process.exit(1);
});
