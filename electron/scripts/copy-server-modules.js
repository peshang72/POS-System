#!/usr/bin/env node

/**
 * Script to copy server node_modules to the build directory, resolving symlinks
 * This is specifically needed for Windows builds
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

console.log("🚀 Copying server node_modules to build directory...");

// Define paths
const electronDir = path.resolve(__dirname, "..");
const serverDir = path.resolve(electronDir, "../server");
const serverDistDir = path.resolve(serverDir, "dist");

console.log("📁 Server directory: ", serverDir);
console.log("📁 Server dist directory: ", serverDistDir);

// Check if server dist exists
if (!fs.existsSync(serverDistDir)) {
  console.error("❌ Server dist directory not found!");
  process.exit(1);
}

// Path to the node_modules directory
const nodeModulesDir = path.join(serverDistDir, "node_modules");

// Check if node_modules exists
if (!fs.existsSync(nodeModulesDir)) {
  console.error("❌ Server node_modules not found in dist directory!");

  // Check if it exists in the server directory
  const serverNodeModules = path.join(serverDir, "node_modules");
  if (fs.existsSync(serverNodeModules)) {
    console.log(
      "📦 Found node_modules in server directory, will copy from there..."
    );

    // Create node_modules directory in dist if it doesn't exist
    fs.mkdirSync(nodeModulesDir, { recursive: true });

    // Copy function that resolves symlinks
    function copyDirRecursive(src, dest) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      // Read source directory
      const entries = fs.readdirSync(src, { withFileTypes: true });

      // Process each entry
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        try {
          if (entry.isSymbolicLink()) {
            // For symlinks, resolve the target and copy the actual file/directory
            const linkTarget = fs.readlinkSync(srcPath);
            const resolvedTarget = path.resolve(
              path.dirname(srcPath),
              linkTarget
            );

            if (fs.existsSync(resolvedTarget)) {
              if (fs.statSync(resolvedTarget).isDirectory()) {
                copyDirRecursive(resolvedTarget, destPath);
              } else {
                fs.copyFileSync(resolvedTarget, destPath);
              }
            } else {
              console.warn(`⚠️ Broken symlink: ${srcPath} -> ${linkTarget}`);
            }
          } else if (entry.isDirectory()) {
            // For directories, recurse
            copyDirRecursive(srcPath, destPath);
          } else {
            // For regular files, just copy
            fs.copyFileSync(srcPath, destPath);
          }
        } catch (error) {
          console.error(`❌ Error processing ${srcPath}:`, error.message);
        }
      }
    }

    // Start copying
    console.log("📦 Copying node_modules from server to dist...");
    try {
      copyDirRecursive(serverNodeModules, nodeModulesDir);
      console.log("✅ Successfully copied node_modules to dist!");
    } catch (error) {
      console.error("❌ Failed to copy node_modules:", error.message);
      process.exit(1);
    }
  } else {
    // If no node_modules found anywhere, install them
    console.log("📦 Installing node_modules in dist directory...");

    // Check if package.json exists in dist
    const distPackageJson = path.join(serverDistDir, "package.json");
    if (!fs.existsSync(distPackageJson)) {
      // Copy package.json from server directory if needed
      const serverPackageJson = path.join(serverDir, "package.json");
      if (fs.existsSync(serverPackageJson)) {
        console.log("📄 Copying package.json to dist directory...");
        fs.copyFileSync(serverPackageJson, distPackageJson);
      } else {
        console.error("❌ No package.json found in server or dist directory!");
        process.exit(1);
      }
    }

    // Install dependencies in dist directory
    console.log("📦 Running npm install in dist directory...");
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
      console.error("❌ Failed to install dependencies!");
      process.exit(1);
    }

    console.log("✅ Successfully installed node_modules in dist!");
  }
} else {
  console.log("✅ Server node_modules already exist in dist directory");
}

// Check if we need to copy to build directory for Windows
const winBuildDir = path.join(
  electronDir,
  "dist/win-unpacked/resources/server/dist"
);
if (fs.existsSync(winBuildDir)) {
  console.log(
    "🔍 Found Windows build directory, copying node_modules there as well..."
  );

  const buildNodeModules = path.join(winBuildDir, "node_modules");

  // Create node_modules directory in build if it doesn't exist
  if (!fs.existsSync(buildNodeModules)) {
    fs.mkdirSync(buildNodeModules, { recursive: true });
  }

  // Create a copy script for better error handling
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
    
    // Copy function that resolves symlinks
    function copyDir(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        try {
          if (entry.isSymbolicLink && entry.isSymbolicLink()) {
            // For symlinks, resolve the target and copy the actual file/directory
            const linkTarget = fs.readlinkSync(srcPath);
            const resolvedTarget = path.resolve(path.dirname(srcPath), linkTarget);
            
            if (fs.existsSync(resolvedTarget)) {
              if (fs.statSync(resolvedTarget).isDirectory()) {
                if (!fs.existsSync(destPath)) {
                  fs.mkdirSync(destPath, { recursive: true });
                }
                copyDir(resolvedTarget, destPath);
              } else {
                fs.copyFileSync(resolvedTarget, destPath);
              }
            }
          } else if (entry.isDirectory()) {
            // For directories, recurse
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyDir(srcPath, destPath);
          } else {
            // For regular files, just copy
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
      process.exit(1);
    }
  `;

  fs.writeFileSync(copyScriptPath, copyScriptContent);
  console.log("📝 Created copy script");

  // Execute the copy script
  try {
    const nodeResult = spawnSync("node", [copyScriptPath], {
      stdio: "inherit",
      shell: true,
    });

    if (nodeResult.status !== 0) {
      throw new Error("Copy script exited with non-zero status");
    }

    console.log(
      "✅ Successfully copied node_modules to Windows build directory!"
    );
  } catch (error) {
    console.error(
      "❌ Failed to copy node_modules to Windows build directory:",
      error.message
    );
  }
}

// Create a final verification file
try {
  const verificationFile = path.join(serverDistDir, "express-included.txt");
  fs.writeFileSync(
    verificationFile,
    `This file marks that the Express module has been properly included.\nCreated: ${new Date().toISOString()}\n`
  );
  console.log("📝 Created verification file in server/dist");

  // Also create in Windows build directory if it exists
  if (fs.existsSync(winBuildDir)) {
    const winVerificationFile = path.join(winBuildDir, "express-included.txt");
    fs.writeFileSync(
      winVerificationFile,
      `This file marks that the Express module has been properly included.\nCreated: ${new Date().toISOString()}\n`
    );
    console.log("📝 Created verification file in Windows build directory");
  }
} catch (error) {
  console.warn("⚠️ Could not create verification file:", error.message);
}

console.log("🎉 Server modules copy process completed successfully!");
