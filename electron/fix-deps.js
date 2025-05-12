#!/usr/bin/env node

/**
 * This script fixes deprecated dependencies in the Electron application
 * It can be run anytime dependency warnings appear
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔍 Checking for deprecated dependencies...");

// Define packages to upgrade with their latest versions
const packagesToUpgrade = {
  glob: "^10.3.10",
  inflight: "^1.0.6",
  // Removed boolean to avoid conflicts
};

// Check if electron directory exists
const electronDir = __dirname;
console.log("📦 Working in directory:", electronDir);

// Create .npmrc file if it doesn't exist
const npmrcPath = path.join(electronDir, ".npmrc");
if (!fs.existsSync(npmrcPath)) {
  console.log("📝 Creating .npmrc file...");
  const npmrcContent = `# Force resolution of deprecated packages
legacy-peer-deps=true
# Use exact versions for better reproducibility
save-exact=true
# Resolve package versions
public-hoist-pattern[]=glob
public-hoist-pattern[]=inflight`;

  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log("✅ Created .npmrc file");
}

// Update package.json if needed
const packageJsonPath = path.join(electronDir, "package.json");
if (fs.existsSync(packageJsonPath)) {
  console.log("📝 Updating package.json...");

  try {
    // Read package.json
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    let packageJson = JSON.parse(packageJsonContent);

    // Remove direct dependencies that might conflict with overrides
    if (packageJson.dependencies) {
      Object.keys(packagesToUpgrade).forEach((pkg) => {
        if (packageJson.dependencies[pkg]) {
          console.log(`🗑️ Removing direct dependency on ${pkg}...`);
          delete packageJson.dependencies[pkg];
        }
      });

      // Also remove boolean if it exists
      if (packageJson.dependencies.boolean) {
        console.log(`🗑️ Removing direct dependency on boolean...`);
        delete packageJson.dependencies.boolean;
      }

      // If dependencies is empty, remove it
      if (Object.keys(packageJson.dependencies).length === 0) {
        delete packageJson.dependencies;
      }
    }

    // Add overrides if they don't exist
    let updated = false;
    if (!packageJson.overrides) {
      packageJson.overrides = {};
      updated = true;
    }

    // Add resolutions if they don't exist
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
      updated = true;
    }

    // Update overrides and resolutions
    Object.entries(packagesToUpgrade).forEach(([pkg, version]) => {
      if (
        !packageJson.overrides[pkg] ||
        packageJson.overrides[pkg] !== version
      ) {
        packageJson.overrides[pkg] = version;
        updated = true;
      }

      if (
        !packageJson.resolutions[pkg] ||
        packageJson.resolutions[pkg] !== version
      ) {
        packageJson.resolutions[pkg] = version;
        updated = true;
      }
    });

    // Write updated package.json if changed
    if (updated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("✅ Updated package.json with overrides and resolutions");
    } else {
      console.log(
        "✅ package.json already has the correct overrides and resolutions"
      );
    }
  } catch (error) {
    console.error("❌ Error updating package.json:", error.message);
  }
}

// Check if node_modules exists
const nodeModulesDir = path.join(electronDir, "node_modules");
if (fs.existsSync(nodeModulesDir)) {
  // Remove problem packages directly
  console.log("🧹 Removing problematic packages directly...");
  Object.keys(packagesToUpgrade).forEach((pkg) => {
    const pkgDir = path.join(nodeModulesDir, pkg);
    if (fs.existsSync(pkgDir)) {
      try {
        console.log(`🗑️ Removing ${pkg}...`);
        fs.rmSync(pkgDir, { recursive: true, force: true });
      } catch (error) {
        console.error(`❌ Error removing ${pkg}:`, error.message);
      }
    }
  });
}

// Install updated packages
console.log("📦 Installing updated packages...");
try {
  // Use --force to install all dependencies at once respecting overrides from package.json
  execSync("npm install --force", {
    stdio: "inherit",
    cwd: electronDir,
  });

  console.log("✅ Dependencies updated successfully");
} catch (error) {
  console.error("❌ Error installing dependencies:", error.message);
  console.log(
    "🛠️ Please try running 'cd electron && npm install --force' manually"
  );
}

console.log("🎉 Fix process completed!");
