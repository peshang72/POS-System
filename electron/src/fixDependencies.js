const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { app } = require("electron");
const log = require("electron-log");

/**
 * This script fixes missing dependencies in the server dist folder
 * It runs at startup to ensure all required modules are available
 */
async function fixServerDependencies() {
  log.info("Starting server dependency check and fix...");

  // Get paths
  const resourcesPath =
    process.resourcesPath || path.join(app.getAppPath(), "..", "resources");
  const serverDistPath = path.join(resourcesPath, "server", "dist");
  const nodeModulesPath = path.join(serverDistPath, "node_modules");

  log.info("Resources path:", resourcesPath);
  log.info("Server dist path:", serverDistPath);
  log.info("Node modules path:", nodeModulesPath);

  try {
    // Check if server directory exists
    if (!fs.existsSync(serverDistPath)) {
      log.error("Server dist directory not found:", serverDistPath);
      return false;
    }

    // Check if package.json exists
    const packageJsonPath = path.join(serverDistPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      log.error("Server package.json not found:", packageJsonPath);
      return false;
    }

    // Check if node_modules exists and has express
    const expressPath = path.join(nodeModulesPath, "express");
    if (fs.existsSync(expressPath)) {
      log.info("Express module found, no fix needed");
      return true;
    }

    log.warn("Express module not found, attempting to fix...");

    // Need to install dependencies
    if (!fs.existsSync(nodeModulesPath)) {
      fs.mkdirSync(nodeModulesPath, { recursive: true });
      log.info("Created node_modules directory");
    }

    // On Windows, try to use bundled Node.js executable
    const nodePath = path.join(resourcesPath, "node.exe");

    if (fs.existsSync(nodePath)) {
      log.info("Using bundled Node.js at:", nodePath);

      // Create npm command script
      const npmScriptPath = path.join(serverDistPath, "install-deps.js");
      const npmScriptContent = `
        const { execSync } = require('child_process');
        const path = require('path');
        const fs = require('fs');
        
        const essentialPackages = [
          'express',
          'cors',
          'body-parser',
          'mongoose',
          'jsonwebtoken'
        ];
        
        console.log('Installing essential server packages...');
        
        // Current directory should be server/dist
        for (const pkg of essentialPackages) {
          try {
            console.log('Installing', pkg);
            execSync('npm install --save --no-bin-links ' + pkg, {
              stdio: 'inherit',
              shell: true
            });
            console.log(pkg, 'installed successfully');
          } catch (err) {
            console.error('Failed to install', pkg, err.message);
          }
        }
        
        console.log('Dependency installation completed');
      `;

      fs.writeFileSync(npmScriptPath, npmScriptContent);
      log.info("Created dependency installation script");

      // Run the script with the bundled Node.js
      try {
        // Escape paths for Windows
        const escapedNodePath = nodePath.replace(/\\/g, "\\\\");
        const escapedScriptPath = npmScriptPath.replace(/\\/g, "\\\\");

        log.info("Running dependency installation script...");
        const result = spawnSync(escapedNodePath, [escapedScriptPath], {
          cwd: serverDistPath,
          stdio: "pipe",
          shell: true,
        });

        log.info("Script output:", result.stdout?.toString() || "No output");
        if (result.stderr) {
          log.error("Script error output:", result.stderr.toString());
        }

        // Check if express was installed
        if (fs.existsSync(expressPath)) {
          log.info("Express module successfully installed");
          return true;
        } else {
          log.error("Express module still missing after installation attempt");

          // Last resort - direct module linking
          log.info("Attempting emergency module linking...");

          // Try to copy express from the node_modules in the asar package
          const asarNodeModules = path.join(app.getAppPath(), "node_modules");
          const asarExpressPath = path.join(asarNodeModules, "express");

          if (fs.existsSync(asarExpressPath)) {
            log.info("Found express in asar package, copying to server...");

            // Create a script to copy the module
            const copyScriptPath = path.join(serverDistPath, "copy-express.js");
            const copyScriptContent = `
              const fs = require('fs');
              const path = require('path');
              
              const sourceDir = '${asarExpressPath.replace(/\\/g, "\\\\")}';
              const targetDir = '${expressPath.replace(/\\/g, "\\\\")}';
              
              console.log('Copying express from:', sourceDir);
              console.log('Copying to:', targetDir);
              
              // Create target directory
              fs.mkdirSync(targetDir, { recursive: true });
              
              function copyDir(src, dest) {
                const entries = fs.readdirSync(src, { withFileTypes: true });
                
                for (const entry of entries) {
                  const srcPath = path.join(src, entry.name);
                  const destPath = path.join(dest, entry.name);
                  
                  if (entry.isDirectory()) {
                    fs.mkdirSync(destPath, { recursive: true });
                    copyDir(srcPath, destPath);
                  } else {
                    try {
                      fs.copyFileSync(srcPath, destPath);
                    } catch (err) {
                      console.error('Error copying file:', srcPath, err.message);
                    }
                  }
                }
              }
              
              try {
                copyDir(sourceDir, targetDir);
                console.log('Express module copied successfully');
              } catch (err) {
                console.error('Failed to copy express module:', err.message);
              }
            `;

            fs.writeFileSync(copyScriptPath, copyScriptContent);

            // Run the copy script
            spawnSync(escapedNodePath, [copyScriptPath], {
              cwd: serverDistPath,
              stdio: "pipe",
              shell: true,
            });

            // Final check
            if (fs.existsSync(expressPath)) {
              log.info("Express module successfully copied");
              return true;
            }
          }

          return false;
        }
      } catch (err) {
        log.error("Failed to run dependency installation script:", err.message);
        return false;
      }
    } else {
      log.error("Bundled Node.js not found, cannot fix dependencies");
      return false;
    }
  } catch (error) {
    log.error("Error fixing server dependencies:", error.message);
    return false;
  }
}

module.exports = { fixServerDependencies };
