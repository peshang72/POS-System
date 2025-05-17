/**
 * Script to download portable Node.js for Windows and include it in the build
 * This ensures the app can run the server without requiring Node.js to be installed
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

// Use a specific Node.js LTS version that matches your Electron version
const NODE_VERSION = "v20.9.0"; // Match Electron's Node version for better compatibility
const DOWNLOAD_URL = `https://nodejs.org/dist/${NODE_VERSION}/win-x64/node.exe`;
const ALTERNATIVE_URL = `https://nodejs.org/download/release/${NODE_VERSION}/win-x64/node.exe`;
const MIRROR_URL = `https://nodejs.org/download/release/${NODE_VERSION}/win-x64/node.exe`;

// Define all possible output locations to ensure node.exe is found during runtime
const OUTPUT_PATHS = [
  path.join(__dirname, "..", "assets", "node.exe"),
  path.join(__dirname, "..", "extraResources", "node.exe"),
  path.join(__dirname, "..", "resources", "node.exe"),
];
const RESOURCES_PATH = path.join(__dirname, "..", "resources");
const EXTRA_RESOURCES_PATH = path.join(__dirname, "..", "extraResources");
const ASSETS_PATH = path.join(__dirname, "..", "assets");

console.log("Starting download of portable Node.js...");
console.log(`Downloading Node.js version ${NODE_VERSION} from ${DOWNLOAD_URL}`);

// Create all directories if they don't exist
for (const dir of [ASSETS_PATH, RESOURCES_PATH, EXTRA_RESOURCES_PATH]) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to download the file
function downloadNodeJS(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    console.log(`Downloading from ${url} to ${outputPath}`);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          reject(
            new Error(
              `Failed to download Node.js: ${response.statusCode} ${response.statusMessage}`
            )
          );
          return;
        }

        // Log download progress
        const totalSize = parseInt(response.headers["content-length"], 10);
        let downloadedSize = 0;

        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            process.stdout.write(
              `Downloading: ${percent}% (${downloadedSize} / ${totalSize} bytes)\r`
            );
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`\nDownloaded Node.js to ${outputPath}`);
          resolve(outputPath);
        });

        file.on("error", (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

// Main function to handle the download process
async function main() {
  let downloadSuccess = false;
  let errorMessage = "";
  const urls = [DOWNLOAD_URL, ALTERNATIVE_URL, MIRROR_URL];

  // Try each URL until one succeeds
  for (const url of urls) {
    if (downloadSuccess) break;

    try {
      // Download to the primary location first
      const primaryOutputPath = OUTPUT_PATHS[0];
      await downloadNodeJS(url, primaryOutputPath);

      // Verify the downloaded file
      const stats = fs.statSync(primaryOutputPath);
      console.log(`Downloaded file size: ${stats.size} bytes`);

      if (stats.size < 10000000) {
        // Node.exe should be large (>10MB)
        console.warn(
          "WARNING: Downloaded file is suspiciously small, might be corrupted"
        );
        throw new Error("Downloaded file is too small, likely corrupted");
      }

      // Copy to all other locations
      for (let i = 1; i < OUTPUT_PATHS.length; i++) {
        console.log(`Copying Node.js to ${OUTPUT_PATHS[i]}`);
        fs.copyFileSync(primaryOutputPath, OUTPUT_PATHS[i]);
      }

      console.log("Node.js is ready for packaging!");
      console.log("Locations:");
      for (const path of OUTPUT_PATHS) {
        if (fs.existsSync(path)) {
          console.log(`✅ ${path} - ${fs.statSync(path).size} bytes`);
        } else {
          console.log(`❌ ${path} - NOT FOUND`);
        }
      }

      downloadSuccess = true;
    } catch (error) {
      console.error(`Error downloading from URL ${url}: ${error.message}`);
      errorMessage += `\nFailed to download from ${url}: ${error.message}`;
    }
  }

  if (!downloadSuccess) {
    console.error("FATAL: Failed to download Node.js from all sources.");
    console.error(errorMessage);
    process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
