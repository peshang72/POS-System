#!/usr/bin/env node

/**
 * Script to properly prepare server dependencies for Windows builds
 * This ensures that all required node modules are available in the server/dist directory
 * before packaging the application
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Preparing server modules for Windows build...");

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

// Define paths
const electronDir = path.resolve(__dirname, "..");
const serverDir = path.resolve(electronDir, "../server");
const serverDistDir = path.resolve(serverDir, "dist");

console.log("📁 Electron directory: ", electronDir);
console.log("📁 Server directory: ", serverDir);
console.log("📁 Server dist directory: ", serverDistDir);

// Ensure server dist directory exists
if (!fs.existsSync(serverDistDir)) {
  console.log("📁 Creating server dist directory...");
  fs.mkdirSync(serverDistDir, { recursive: true });
}

// Copy server source files to dist if needed
console.log("🔍 Checking server build...");
const serverSrcDir = path.resolve(serverDir, "src");
if (fs.existsSync(serverSrcDir)) {
  // Run the server's build script if it exists
  const serverPackageJson = require(path.join(serverDir, "package.json"));
  if (serverPackageJson.scripts && serverPackageJson.scripts.build) {
    console.log("🛠️ Running server build script...");
    try {
      spawnSync("npm", ["run", "build"], {
        cwd: serverDir,
        stdio: "inherit",
        shell: true,
      });
    } catch (error) {
      console.error("❌ Failed to run server build script:", error);

      // Manual fallback - copy source files to dist
      console.log("🛠️ Falling back to manual file copy...");
      const serverFiles = fs.readdirSync(serverSrcDir, { withFileTypes: true });

      serverFiles.forEach((file) => {
        const srcPath = path.join(serverSrcDir, file.name);
        const dstPath = path.join(serverDistDir, file.name);

        if (file.isDirectory()) {
          // Use recursive directory copy
          if (!fs.existsSync(dstPath)) {
            fs.mkdirSync(dstPath, { recursive: true });
          }

          const copyFn = (src, dst) => {
            const entries = fs.readdirSync(src, { withFileTypes: true });
            entries.forEach((entry) => {
              const srcPath = path.join(src, entry.name);
              const dstPath = path.join(dst, entry.name);

              if (entry.isDirectory()) {
                if (!fs.existsSync(dstPath)) {
                  fs.mkdirSync(dstPath, { recursive: true });
                }
                copyFn(srcPath, dstPath);
              } else {
                fs.copyFileSync(srcPath, dstPath);
              }
            });
          };

          copyFn(srcPath, dstPath);
        } else {
          fs.copyFileSync(srcPath, dstPath);
        }
      });
    }
  } else {
    // No build script, copy manually
    console.log("⚠️ No server build script found, copying files manually...");

    // Make sure dist exists
    if (!fs.existsSync(serverDistDir)) {
      fs.mkdirSync(serverDistDir, { recursive: true });
    }

    // Copy files from src to dist
    const cpResult = spawnSync(
      "cp",
      ["-r", `${serverSrcDir}/*`, serverDistDir],
      {
        shell: true,
        stdio: "inherit",
      }
    );

    if (cpResult.status !== 0) {
      console.error("❌ Failed to copy server files");
    }
  }
}

// Copy package.json if not already present
const packageJsonSrc = path.join(serverDir, "package.json");
const packageJsonDst = path.join(serverDistDir, "package.json");
if (!fs.existsSync(packageJsonDst) && fs.existsSync(packageJsonSrc)) {
  console.log("📄 Copying package.json to server dist directory...");
  fs.copyFileSync(packageJsonSrc, packageJsonDst);
}

// Install dependencies in the server/dist directory
console.log("📦 Installing server dependencies...");
try {
  // First clean any existing node_modules
  const nodeModulesDir = path.join(serverDistDir, "node_modules");
  if (fs.existsSync(nodeModulesDir)) {
    console.log("🧹 Cleaning existing node_modules...");
    fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  }

  // Install production dependencies
  console.log("📦 Installing dependencies with npm...");
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
  console.error("❌ Error installing dependencies:", error.message);

  // Fallback to manual installation of critical dependencies
  console.log("🛠️ Attempting manual installation of critical packages...");
  const criticalPackages = [
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

  for (const pkg of criticalPackages) {
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

// Verify dependencies are installed
console.log("🔍 Verifying dependencies installation...");
const nodeModulesDir = path.join(serverDistDir, "node_modules");
if (fs.existsSync(nodeModulesDir)) {
  console.log("✅ node_modules directory exists");

  // Check for critical dependencies
  const criticalPackages = ["express", "cors", "mongoose", "jsonwebtoken"];
  const missingPackages = [];

  for (const pkg of criticalPackages) {
    const pkgDir = path.join(nodeModulesDir, pkg);
    if (!fs.existsSync(pkgDir)) {
      console.error(`❌ Missing critical package: ${pkg}`);
      missingPackages.push(pkg);
    } else {
      console.log(`✅ Found package: ${pkg}`);
    }
  }

  // Try to fix any missing packages
  if (missingPackages.length > 0) {
    console.log("🛠️ Installing missing packages individually...");
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
} else {
  console.error(
    "❌ Failed to install server dependencies! node_modules directory not found."
  );
  process.exit(1);
}

// Make node_modules readable by anyone to avoid permission issues on Windows
console.log("🔑 Ensuring correct permissions...");
if (process.platform !== "win32") {
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

console.log("🎉 Server modules preparation completed successfully!");
