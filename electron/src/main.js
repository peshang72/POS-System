const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const { spawn } = require("child_process");
// For auto-updates
const { autoUpdater } = require("electron-updater");

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

// Development mode detection
const isDev = process.argv.includes("--dev");
const serverPort = 5000; // Server port - must match the one in apiConfig.js
const clientPort = 5173; // Default Vite port

// Server process reference
let serverProcess = null;
let serverReady = false;

// Get the correct path for resources based on whether running in development or production
function getResourcePath(relativePath) {
  return isDev
    ? path.join(__dirname, relativePath)
    : path.join(process.resourcesPath, relativePath.replace("../../", ""));
}

function showErrorDialog(title, content) {
  dialog.showErrorBox(title, content);
}

// Auto-updater notification functions
function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send("update-message", text);
  }
}

// Add auto-update status events
function setupAutoUpdater() {
  // Skip auto-updates in development mode
  if (isDev) return;

  // Check for updates on startup (after a short delay to ensure window is ready)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 2000);

  // Configure auto-updater events
  autoUpdater.on("checking-for-update", () => {
    sendStatusToWindow("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    sendStatusToWindow("Update available. Downloading...");
    // You could also show a dialog here if you want to prompt the user
    dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: `A new version (${info.version}) is available and being downloaded.`,
      buttons: ["OK"],
    });
  });

  autoUpdater.on("update-not-available", () => {
    sendStatusToWindow("You are running the latest version.");
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    sendStatusToWindow(message);
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendStatusToWindow("Update downloaded. It will be installed on restart.");

    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message:
          "A new version has been downloaded. Restart the application to apply the updates.",
        buttons: ["Restart Now", "Later"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    sendStatusToWindow(`Error in auto-updater: ${err.toString()}`);
  });
}

// Add IPC handlers for manual update checks
function setupUpdateHandlers() {
  ipcMain.handle("check-for-updates", async () => {
    if (isDev) {
      return {
        success: false,
        message: "Updates are disabled in development mode",
      };
    }

    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // Add handler to get app version
  ipcMain.handle("get-version", () => {
    return app.getVersion();
  });
}

function verifyPaths() {
  // Verify client build exists in production mode
  if (!isDev) {
    // Define multiple possible client build paths to check
    const clientDistPaths = [
      getResourcePath("../../client/dist/index.html"),
      getResourcePath("client/dist/index.html"),
      path.join(process.resourcesPath, "client/dist/index.html"),
    ];

    // Check all possible paths
    let clientPathFound = false;
    for (const clientPath of clientDistPaths) {
      console.log(`Checking for client build at: ${clientPath}`);
      if (fs.existsSync(clientPath)) {
        clientPathFound = true;
        console.log(`Found client build at: ${clientPath}`);
        break;
      }
    }

    if (!clientPathFound) {
      showErrorDialog(
        "Missing Client Build",
        `Could not find the client build at: ${clientDistPaths.join(
          ", "
        )}\n\nPlease run "npm run build:client" from the project root to build the client application.`
      );
      return false;
    }

    // Define multiple possible server build paths to check
    const serverPaths = [
      getResourcePath("../../server/dist/index.js"),
      getResourcePath("server/dist/index.js"),
      path.join(process.resourcesPath, "server/dist/index.js"),
    ];

    // Check all possible paths
    let serverPathFound = false;
    for (const serverPath of serverPaths) {
      console.log(`Checking for server build at: ${serverPath}`);
      if (fs.existsSync(serverPath)) {
        serverPathFound = true;
        console.log(`Found server build at: ${serverPath}`);
        break;
      }
    }

    if (!serverPathFound) {
      showErrorDialog(
        "Missing Server Build",
        `Could not find the server build at: ${serverPaths.join(
          ", "
        )}\n\nPlease run "npm run build:server" from the project root to build the server application.`
      );
      return false;
    }
  }

  return true;
}

// Start the backend server
function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, assume server is running externally
      console.log("Development mode - assuming server is running externally");
      serverReady = true;
      resolve();
      return;
    }

    try {
      const serverPath = getResourcePath("../../server/dist/index.js");
      console.log(`Starting server from: ${serverPath}`);

      // Set environment variables for the server
      const env = {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: "production",
        ELECTRON_ENV: "true",
        NODE_PATH: getResourcePath("../../server/node_modules"),
      };

      // Check if server file exists
      if (!fs.existsSync(serverPath)) {
        console.error(`Server file not found: ${serverPath}`);
        showErrorDialog(
          "Server Error",
          `Server file not found at: ${serverPath}\n\nPlease make sure the server is properly built.`
        );
        // Continue anyway to avoid completely blocking the app
        serverReady = true;
        resolve();
        return;
      }

      serverProcess = spawn("node", [serverPath], {
        env,
        // Capture error output with encoding
        stdio: ["ignore", "pipe", "pipe"],
      });

      // Flag to detect if server started successfully
      let serverStarted = false;
      let errorOutput = "";

      serverProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`Server stdout: ${output}`);

        // Check if server is ready
        if (
          output.includes("Server running") ||
          output.includes("listening on port")
        ) {
          console.log(`Server is running on port ${serverPort}`);
          serverReady = true;
          serverStarted = true;
          resolve();
        }
      });

      serverProcess.stderr.on("data", (data) => {
        const output = data.toString();
        console.error(`Server stderr: ${output}`);
        errorOutput += output + "\n";
      });

      serverProcess.on("error", (err) => {
        console.error("Failed to start server process:", err);
        reject(err);
      });

      serverProcess.on("exit", (code) => {
        if (code !== 0 && !serverStarted) {
          console.error(`Server process exited with code ${code}`);
          reject(
            new Error(
              `Server process exited with code ${code}. Error: ${errorOutput}`
            )
          );
        }
      });

      // Set a timeout for server startup
      setTimeout(() => {
        if (!serverStarted) {
          if (errorOutput) {
            console.error("Server startup errors:", errorOutput);
            showErrorDialog(
              "Server Error",
              `Server failed to start properly. Errors:\n\n${errorOutput}\n\nThe application may not function correctly.`
            );
          } else {
            console.log(
              "Server didn't report ready status, but continuing anyway"
            );
          }
          serverReady = true;
          resolve();
        }
      }, 5000); // Wait up to 5 seconds for server to start
    } catch (error) {
      console.error("Error starting server process:", error);
      reject(error);
    }
  });
}

async function createWindow() {
  // Verify required paths first
  if (!verifyPaths()) {
    app.quit();
    return;
  }

  try {
    // Start the server before creating the window
    await startServer();
  } catch (error) {
    showErrorDialog(
      "Server Error",
      `Failed to start the server: ${error.message}\n\nThe application may not function correctly.`
    );
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  // Setup autoupdater
  setupAutoUpdater();
  setupUpdateHandlers();

  // Load the app
  if (isDev) {
    // In development, load from the dev server
    console.log(`Loading from dev server at http://localhost:${clientPort}`);
    mainWindow.loadURL(`http://localhost:${clientPort}`).catch((err) => {
      console.error("Failed to load from dev server:", err);
      showErrorDialog(
        "Development Server Error",
        `Could not connect to the development server at http://localhost:${clientPort}\n\nPlease make sure the development server is running by executing "npm run client" from the project root.`
      );
    });
  }
}
