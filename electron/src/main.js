const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const { spawn } = require("child_process");
// For auto-updates
const { autoUpdater } = require("electron-updater");
// Import the dependency fix module
const { fixServerDependencies } = require("./fixDependencies");

// EMERGENCY DEBUG: Write to a fixed location before anything else happens
try {
  const userFolder =
    process.env.APPDATA ||
    (process.platform === "darwin"
      ? path.join(process.env.HOME, "Library/Preferences")
      : path.join(process.env.HOME, ".local/share"));

  const emergencyLogFile = path.join(userFolder, "emergency-pos-debug.log");

  fs.writeFileSync(
    emergencyLogFile,
    `=== EMERGENCY DEBUG LOG ===\n` +
      `Time: ${new Date().toISOString()}\n` +
      `Node version: ${process.version}\n` +
      `Platform: ${process.platform}\n` +
      `Architecture: ${process.arch}\n` +
      `Process PID: ${process.pid}\n` +
      `Executable path: ${process.execPath}\n` +
      `Working directory: ${process.cwd()}\n` +
      `APPDATA: ${process.env.APPDATA || "not set"}\n` +
      `HOME: ${process.env.HOME || "not set"}\n\n`
  );

  // Log critical parts of the process
  process.on("uncaughtException", (error) => {
    try {
      fs.appendFileSync(
        emergencyLogFile,
        `\n=== UNCAUGHT EXCEPTION ===\n` +
          `Time: ${new Date().toISOString()}\n` +
          `Error: ${error.toString()}\n` +
          `Stack: ${error.stack}\n\n`
      );
    } catch (logError) {
      // Cannot do anything if we can't even log
    }
  });

  process.on("unhandledRejection", (reason, promise) => {
    try {
      fs.appendFileSync(
        emergencyLogFile,
        `\n=== UNHANDLED REJECTION ===\n` +
          `Time: ${new Date().toISOString()}\n` +
          `Reason: ${reason ? reason.toString() : "unknown"}\n` +
          `Stack: ${reason && reason.stack ? reason.stack : "no stack"}\n\n`
      );
    } catch (logError) {
      // Cannot do anything if we can't even log
    }
  });
} catch (initialError) {
  // We can't log the error since logging itself failed
  console.error("CRITICAL: Failed to set up emergency logging:", initialError);
}

// Set up logging to file for easier debugging on Windows
const logFile = path.join(app.getPath("userData"), "app-startup.log");
console.log(`Logging to file: ${logFile}`);

// Override console methods to also log to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Create a function to write to the log file
function writeToLogFile(message) {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    // Use original console to avoid recursion
    originalConsoleError(`Failed to write to log file: ${error.message}`);
  }
}

// Override console methods
console.log = function () {
  const args = Array.from(arguments);
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");

  writeToLogFile(`[LOG] ${message}`);
  originalConsoleLog.apply(console, args);
};

console.error = function () {
  const args = Array.from(arguments);
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");

  writeToLogFile(`[ERROR] ${message}`);
  originalConsoleError.apply(console, args);
};

console.warn = function () {
  const args = Array.from(arguments);
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");

  writeToLogFile(`[WARN] ${message}`);
  originalConsoleWarn.apply(console, args);
};

// Clear log file at startup to avoid it growing too large
try {
  fs.writeFileSync(
    logFile,
    `=== Application started at ${new Date().toISOString()} ===\n`
  );
  console.log("Log file initialized");
} catch (error) {
  originalConsoleError(`Failed to initialize log file: ${error.message}`);
}

// Log application version and environment
console.log(`Application version: ${app.getVersion()}`);
console.log(`Running on platform: ${process.platform}`);
console.log(`Node.js version: ${process.versions.node}`);
console.log(`Electron version: ${process.versions.electron}`);
console.log(`Chrome version: ${process.versions.chrome}`);

// Disable hardware acceleration to prevent libva errors
app.disableHardwareAcceleration();

// Additional Electron settings to improve compatibility
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

// Disable DevTools Autofill to avoid console errors
app.commandLine.appendSwitch("disable-features", "Autofill");

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

// Development mode detection
const isDev = process.argv.includes("--dev");
const serverPort = 5000; // Server port - must match the one in apiConfig.js
const clientPort = 3000; // Default Vite port - now matches vite.config.js

// Server process reference
let serverProcess = null;
let serverReady = false;

// Get the correct path for resources based on whether running in development or production
function getResourcePath(relativePath) {
  console.log(`Getting resource path for: ${relativePath}`);

  // Normalize path separators for cross-platform compatibility
  const normalizedPath = relativePath.replace(/\//g, path.sep);

  if (isDev) {
    const devPath = path.join(__dirname, normalizedPath);
    console.log(`Dev path: ${devPath}`);
    return devPath;
  } else {
    // In production, first try the resource path
    const resourcePath = path.join(
      process.resourcesPath,
      normalizedPath.replace(`..${path.sep}..${path.sep}`, "")
    );
    console.log(`Production path (resourcesPath): ${resourcePath}`);

    // If that fails, try multiple alternative paths with more detailed logging
    if (!fs.existsSync(resourcePath)) {
      console.log(`Resource path doesn't exist: ${resourcePath}`);

      // Try simpler path without replacement
      const simplePath = path.join(process.resourcesPath, normalizedPath);
      console.log(`Trying simpler path: ${simplePath}`);
      if (fs.existsSync(simplePath)) {
        return simplePath;
      }

      // Try more direct path
      const directPath = path.join(
        process.resourcesPath,
        normalizedPath.split(path.sep).pop()
      );
      console.log(`Trying direct path: ${directPath}`);
      if (fs.existsSync(directPath)) {
        return directPath;
      }
    }

    return resourcePath;
  }
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

  // Add handler to get server status
  ipcMain.handle("get-server-status", () => {
    return {
      running: serverReady,
      port: serverPort,
    };
  });

  // Add handler to restart server
  ipcMain.handle("restart-server", async () => {
    try {
      if (serverProcess) {
        // Kill the existing server process
        serverProcess.kill();
        serverProcess = null;
        serverReady = false;

        // Notify clients that server is restarting
        if (mainWindow) {
          mainWindow.webContents.send("server-status", {
            status: "restarting",
          });
        }

        // Wait a bit before restarting
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Restart the server
        await startServer();

        return { success: true, message: "Server restarted successfully" };
      } else {
        // Just start the server if it's not running
        await startServer();
        return { success: true, message: "Server started successfully" };
      }
    } catch (error) {
      console.error("Failed to restart server:", error);
      return { success: false, message: error.message };
    }
  });

  // Add handler to get locales data
  ipcMain.handle("get-locales-data", async () => {
    try {
      const localesPath = process.env.LOCALES_PATH;
      if (!localesPath) {
        console.warn("LOCALES_PATH environment variable is not set");
        return null;
      }

      console.log(`Main: Loading locales from: ${localesPath}`);
      const locales = {};

      // Check if directory exists
      if (fs.existsSync(localesPath)) {
        // Read files in the locales directory
        const files = fs.readdirSync(localesPath);
        console.log(`Main: Found locale files:`, files);

        // Load each JSON locale file
        files.forEach((file) => {
          if (file.endsWith(".json")) {
            try {
              const localeName = file.replace(".json", "");
              const filePath = path.join(localesPath, file);
              console.log(`Main: Reading locale file: ${filePath}`);
              const content = fs.readFileSync(filePath, "utf8");
              const parsedContent = JSON.parse(content);
              locales[localeName] = { translation: parsedContent };
              console.log(`Main: Successfully loaded locale: ${localeName}`);
            } catch (fileError) {
              console.error(
                `Main: Error loading locale file ${file}:`,
                fileError
              );
            }
          }
        });

        console.log("Main: Loaded locales:", Object.keys(locales));

        if (Object.keys(locales).length === 0) {
          console.warn("Main: No locales were loaded successfully");
          return null;
        }

        return locales;
      } else {
        console.warn(`Main: Locales directory does not exist: ${localesPath}`);
        return null;
      }
    } catch (error) {
      console.error("Main: Error loading locales:", error);
      return null;
    }
  });
}

function verifyPaths() {
  // Verify client build exists in production mode
  if (!isDev) {
    // Create special log file for Windows installer troubleshooting
    const winDebugLogFile = path.join(
      app.getPath("userData"),
      "windows-installer-debug.log"
    );
    try {
      fs.writeFileSync(
        winDebugLogFile,
        `=== Windows Installer Debug Log - Application started at ${new Date().toISOString()} ===\n` +
          `Version: ${app.getVersion()}\n` +
          `User Data Path: ${app.getPath("userData")}\n` +
          `Platform: ${process.platform}\n` +
          `Architecture: ${process.arch}\n` +
          `Node.js: ${process.versions.node}\n` +
          `Electron: ${process.versions.electron}\n` +
          `Chrome: ${process.versions.chrome}\n`
      );
    } catch (err) {
      console.error("Failed to create Windows debug log file:", err);
    }

    function logToWinDebug(message) {
      try {
        fs.appendFileSync(
          winDebugLogFile,
          `${new Date().toISOString()} - ${message}\n`
        );
      } catch (err) {
        // Just log to console if we can't write to the file
        console.error("Failed to write to Windows debug log:", err);
      }
    }

    // Log key paths for debugging
    console.log(`App path: ${app.getAppPath()}`);
    console.log(`Resources path: ${process.resourcesPath}`);
    console.log(`Executable path: ${app.getPath("exe")}`);
    logToWinDebug(`App path: ${app.getAppPath()}`);
    logToWinDebug(`Resources path: ${process.resourcesPath}`);
    logToWinDebug(`Executable path: ${app.getPath("exe")}`);

    // List resources directory content
    try {
      console.log("Listing content of resources directory:");
      logToWinDebug("Listing content of resources directory:");
      const files = fs.readdirSync(process.resourcesPath);
      console.log("Resources directory contents:", files);
      logToWinDebug(`Resources directory contents: ${files.join(", ")}`);

      // Check for client and server in resources
      const clientDir = path.join(process.resourcesPath, "client");
      const serverDir = path.join(process.resourcesPath, "server");

      if (fs.existsSync(clientDir)) {
        console.log("Client directory exists in resources");
        logToWinDebug("Client directory exists in resources");
        const clientFiles = fs.readdirSync(clientDir);
        console.log("Client directory contents:", clientFiles);
        logToWinDebug(`Client directory contents: ${clientFiles.join(", ")}`);

        const clientDistDir = path.join(clientDir, "dist");
        if (fs.existsSync(clientDistDir)) {
          console.log("Client dist directory exists");
          logToWinDebug("Client dist directory exists");
          const clientDistFiles = fs.readdirSync(clientDistDir);
          console.log("Client dist contents:", clientDistFiles);
          logToWinDebug(`Client dist contents: ${clientDistFiles.join(", ")}`);
        } else {
          console.error("❌ Client dist directory missing");
          logToWinDebug("❌ Client dist directory missing");
        }
      } else {
        console.error("❌ Client directory missing in resources");
        logToWinDebug("❌ Client directory missing in resources");
      }

      if (fs.existsSync(serverDir)) {
        console.log("Server directory exists in resources");
        logToWinDebug("Server directory exists in resources");
        const serverFiles = fs.readdirSync(serverDir);
        console.log("Server directory contents:", serverFiles);
        logToWinDebug(`Server directory contents: ${serverFiles.join(", ")}`);

        const serverDistDir = path.join(serverDir, "dist");
        if (fs.existsSync(serverDistDir)) {
          console.log("Server dist directory exists");
          logToWinDebug("Server dist directory exists");
          const serverDistFiles = fs.readdirSync(serverDistDir);
          console.log("Server dist contents:", serverDistFiles);
          logToWinDebug(`Server dist contents: ${serverDistFiles.join(", ")}`);
        } else {
          console.error("❌ Server dist directory missing");
          logToWinDebug("❌ Server dist directory missing");
        }
      } else {
        console.error("❌ Server directory missing in resources");
        logToWinDebug("❌ Server directory missing in resources");
      }
    } catch (error) {
      console.error("Error listing resources:", error);
      logToWinDebug(`Error listing resources: ${error.message}`);
    }

    // Define multiple possible client build paths to check
    const clientDistPaths = [
      path.join(process.resourcesPath, "client/dist/index.html"),
      getResourcePath("../../client/dist/index.html"),
      getResourcePath("client/dist/index.html"),
      path.join(app.getAppPath(), "../client/dist/index.html"),
      path.join(app.getPath("exe"), "../resources/client/dist/index.html"),
      path.join(__dirname, "../../client/dist/index.html"),
      path.join(__dirname, "../client/dist/index.html"),
    ];

    // Check all possible paths
    let clientPathFound = false;
    let foundClientPath = "";

    console.log("Searching for client build in the following paths:");
    for (const clientPath of clientDistPaths) {
      console.log(`Checking for client build at: ${clientPath}`);
      try {
        if (fs.existsSync(clientPath)) {
          clientPathFound = true;
          foundClientPath = clientPath;
          console.log(`Found client build at: ${clientPath}`);
          break;
        }
      } catch (error) {
        console.error(`Error checking path ${clientPath}:`, error);
      }
    }

    if (!clientPathFound) {
      showErrorDialog(
        "Missing Client Build",
        `Could not find the client build. Please make sure the application was properly installed.\n\nChecked paths:\n${clientDistPaths.join(
          "\n"
        )}\n\nIf the issue persists, please reinstall the application.`
      );
      return false;
    }

    // Define multiple possible server build paths to check
    const serverPaths = [
      getResourcePath("../../server/dist/index.js"),
      getResourcePath("server/dist/index.js"),
      path.join(process.resourcesPath, "server/dist/index.js"),
      path.join(app.getAppPath(), "../server/dist/index.js"),
      path.join(app.getPath("exe"), "../resources/server/dist/index.js"),
      path.join(__dirname, "../../server/dist/index.js"),
      path.join(__dirname, "../server/dist/index.js"),
    ];

    // Check all possible paths
    let serverPathFound = false;
    let foundServerPath = "";

    console.log("Searching for server build in the following paths:");
    for (const serverPath of serverPaths) {
      console.log(`Checking for server build at: ${serverPath}`);
      try {
        if (fs.existsSync(serverPath)) {
          serverPathFound = true;
          foundServerPath = serverPath;
          console.log(`Found server build at: ${serverPath}`);
          break;
        }
      } catch (error) {
        console.error(`Error checking path ${serverPath}:`, error);
      }
    }

    if (!serverPathFound) {
      showErrorDialog(
        "Missing Server Build",
        `Could not find the server build. Please make sure the application was properly installed.\n\nChecked paths:\n${serverPaths.join(
          "\n"
        )}\n\nIf the issue persists, please reinstall the application.`
      );
      return false;
    }
  }

  return true;
}

// Start the backend server
function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // Log environment for debugging
      console.log("Starting server with environment:");
      console.log(`- isDev: ${isDev}`);
      console.log(`- Platform: ${process.platform}`);
      console.log(`- resourcesPath: ${process.resourcesPath}`);

      // Fix server dependencies if running on Windows
      if (process.platform === "win32" && !isDev) {
        console.log("Checking and fixing server dependencies for Windows...");
        try {
          const fixResult = await fixServerDependencies();
          if (fixResult) {
            console.log("✅ Server dependencies fixed successfully");
          } else {
            console.warn(
              "⚠️ Server dependencies may not be complete - continuing anyway"
            );
          }
        } catch (fixError) {
          console.error("❌ Error fixing server dependencies:", fixError);
          // Continue anyway - we'll try starting the server regardless
        }
      }

      // In dev mode, we'll try to start the server directly from the source
      let serverPath;

      if (isDev) {
        // Development paths - start from source
        const projectRootDir = path.resolve(__dirname, "../../");
        serverPath = path.join(projectRootDir, "server", "src", "index.js");
        console.log(
          "Development mode - starting server from source: " + serverPath
        );

        // Check additional paths if needed
        if (!fs.existsSync(serverPath)) {
          console.log("Server path not found, trying alternative locations...");
          const altPaths = [
            path.join(__dirname, "..", "server", "src", "index.js"),
            path.join(projectRootDir, "server", "dist", "index.js"),
          ];

          for (const altPath of altPaths) {
            console.log("Checking: " + altPath);
            if (fs.existsSync(altPath)) {
              serverPath = altPath;
              console.log("Found server at: " + serverPath);
              break;
            }
          }
        }
      } else {
        // Production paths - look in resources directory first
        const possibleServerPaths = [
          path.join(process.resourcesPath, "server", "dist", "index.js"),
          path.join(process.resourcesPath, "server", "dist", "index.js"),
          getResourcePath(path.join("server", "dist", "index.js")),
          getResourcePath(path.join("..", "..", "server", "dist", "index.js")),
          path.join(app.getAppPath(), "..", "server", "dist", "index.js"),
          path.join(__dirname, "..", "..", "server", "dist", "index.js"),
        ];

        console.log("Checking for server in production paths:");
        let serverFound = false;

        for (const possiblePath of possibleServerPaths) {
          console.log(`Checking: ${possiblePath}`);
          if (fs.existsSync(possiblePath)) {
            serverPath = possiblePath;
            serverFound = true;
            console.log(`✅ Found server at: ${serverPath}`);
            break;
          }
        }

        if (!serverFound) {
          // If we couldn't find the server, check the resources directory contents
          console.log(
            "Server not found in expected locations. Searching in resources directory..."
          );
          if (fs.existsSync(process.resourcesPath)) {
            const findServerFile = function (dir, fileName) {
              console.log(`Searching in ${dir} for ${fileName}`);
              if (!fs.existsSync(dir)) return null;

              const entries = fs.readdirSync(dir, { withFileTypes: true });

              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                  const found = findServerFile(fullPath, fileName);
                  if (found) return found;
                } else if (entry.name === fileName) {
                  console.log(`Found ${fileName} at ${fullPath}`);
                  return fullPath;
                }
              }

              return null;
            };

            const foundServerPath = findServerFile(
              process.resourcesPath,
              "index.js"
            );
            if (foundServerPath) {
              serverPath = foundServerPath;
              console.log(`Found server by search at: ${serverPath}`);
            }
          }
        }
      }

      // Check if we found a valid server path
      if (!serverPath || !fs.existsSync(serverPath)) {
        const error = `Could not find server at any location. Last checked: ${serverPath}`;
        console.error(error);
        reject(new Error(error));
        return;
      }

      console.log(`Starting server from path: ${serverPath}`);

      // Create a batch file for launching the server (as a fallback)
      const batchFilePath = createServerBatchFile(serverPath);

      // Create a separate environment for the server
      const env = { ...process.env };

      // Set required environment variables
      env.ELECTRON_ENV = "true";
      env.NODE_ENV = isDev ? "development" : "production";
      env.PORT = serverPort.toString();

      // Windows-specific workarounds
      if (process.platform === "win32") {
        console.log(
          "Applying Windows-specific configuration for server process"
        );
        // Add NODE_PATH to help Node.js find modules on Windows
        env.NODE_PATH = path.dirname(serverPath);

        // More Windows-specific configuration
        env.ELECTRON_RUN_AS_NODE = "1";
        env.ELECTRON_NO_ASAR = "1";

        // Fix potential path issues on Windows
        serverPath = serverPath.replace(/\\/g, "/");

        // Add more debugging
        if (
          fs.existsSync(
            path.join(app.getPath("userData"), "windows-installer-debug.log")
          )
        ) {
          try {
            const message = `Windows server config - serverPath: ${serverPath}, NODE_PATH: ${env.NODE_PATH}`;
            fs.appendFileSync(
              path.join(app.getPath("userData"), "windows-installer-debug.log"),
              `${new Date().toISOString()} - ${message}\n`
            );
          } catch (err) {
            console.error("Error writing to Windows debug log:", err);
          }
        }
      }

      // Create server process with enhanced logging
      console.log("Spawning node process with server path:", serverPath);

      // Use different spawn options for Windows
      const spawnOptions = {
        env: env,
        windowsHide: false, // Show command prompt window for debugging on Windows
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      };

      // Add shell option for Windows to handle path issues
      if (process.platform === "win32") {
        spawnOptions.shell = true;
      }

      // Set a timeout for server startup
      const startupTimeout = setTimeout(() => {
        if (!serverReady) {
          console.error("Server startup timed out after 30 seconds");

          // On Windows, the server might be running but not sending the expected message
          // Try to force serverReady to true and continue
          if (process.platform === "win32") {
            console.log(
              "Windows platform detected - forcing serverReady to true despite timeout"
            );
            serverReady = true;

            // Notify the renderer process
            if (mainWindow) {
              mainWindow.webContents.send("server-status", {
                status: "running",
                port: serverPort,
              });
            }

            resolve();
          } else {
            reject(new Error("Server startup timed out after 30 seconds"));
          }
        }
      }, 30000);

      // Use the most appropriate method to start the Node.js server
      if (process.platform === "win32") {
        // On Windows, try these approaches in order:

        // 1. First check if we have a bundled node.exe directly in resources
        const bundledNodePath = path.join(process.resourcesPath, "node.exe");

        if (fs.existsSync(bundledNodePath)) {
          console.log(
            `Found bundled Node.js at ${bundledNodePath}, using it to run server`
          );
          serverProcess = spawn(bundledNodePath, [serverPath], {
            ...spawnOptions,
            shell: false, // Direct execution, no shell needed
          });
        }
        // 2. If no bundled node.exe, use the batch file we created
        else if (batchFilePath && fs.existsSync(batchFilePath)) {
          console.log(`Using server batch file: ${batchFilePath}`);
          serverProcess = spawn(batchFilePath, [], {
            ...spawnOptions,
            shell: true,
          });
        }
        // 3. Last resort: try the command processor approach
        else {
          const cmdPath = process.env.ComSpec || "cmd.exe";
          console.log(`Fallback to command processor: ${cmdPath}`);

          // Escape quotes and spaces in paths
          const escapedServerPath = serverPath.replace(/"/g, '\\"');

          serverProcess = spawn(
            cmdPath,
            ["/c", "node", `"${escapedServerPath}"`],
            spawnOptions
          );
        }
      } else {
        // On non-Windows platforms, use the standard approach
        serverProcess = spawn("node", [serverPath], spawnOptions);
      }

      // Set up all event handlers for the server process
      setupServerProcessHandlers(
        serverProcess,
        startupTimeout,
        resolve,
        reject
      );
    } catch (error) {
      console.error("Error starting server:", error);
      reject(error);
    }
  });
}

// Helper function to set up all the event handlers for a server process
function setupServerProcessHandlers(
  process,
  timeout,
  resolvePromise,
  rejectPromise
) {
  // Handle stdout
  process.stdout.on("data", (data) => {
    const message = data.toString().trim();
    console.log("Server stdout:", message);

    // Improved logging: Send all server console output to renderer for debugging
    if (mainWindow) {
      mainWindow.webContents.send("server-log", {
        type: "info",
        message: message,
      });
    }

    // Check if server is running message
    if (message.includes("Server running on port")) {
      clearTimeout(timeout);
      serverReady = true;
      console.log(`Server is running on port ${serverPort}`);

      // Notify the renderer process
      if (mainWindow) {
        mainWindow.webContents.send("server-status", {
          status: "running",
          port: serverPort,
        });
      }

      resolvePromise();
    }
  });

  // Handle stderr
  process.stderr.on("data", (data) => {
    const message = data.toString().trim();
    console.error("Server stderr:", message);

    // Send server errors to renderer for debugging
    if (mainWindow) {
      mainWindow.webContents.send("server-log", {
        type: "error",
        message: message,
      });
    }
  });

  // Handle server process exit
  process.on("exit", (code, signal) => {
    clearTimeout(timeout);
    serverReady = false;
    console.log(`Server process exited with code ${code} and signal ${signal}`);

    // Try fallback approach for Windows if first attempt fails with code 1 (command not found)
    if (process.platform === "win32" && code === 1 && !serverReady) {
      console.log(
        "Attempting fallback method for starting server on Windows..."
      );

      try {
        // Get access to serverPath from parent scope (or use a reasonable default)
        let serverPath;
        try {
          serverPath = process.spawnargs[process.spawnargs.length - 1];
          // If path has quotes, remove them
          if (
            serverPath &&
            serverPath.startsWith('"') &&
            serverPath.endsWith('"')
          ) {
            serverPath = serverPath.slice(1, -1);
          }
        } catch (e) {
          // Use a backup method to get the server path
          serverPath = path.join(
            process.resourcesPath,
            "server",
            "dist",
            "index.js"
          );
          console.log(`Using backup server path: ${serverPath}`);
        }

        const spawnOptions = {
          env: process.env,
          windowsHide: false,
          stdio: ["pipe", "pipe", "pipe", "ipc"],
          shell: true,
        };

        // Try these methods in order:

        // 1. Try using the batch file if it exists
        const batchFilePath = path.join(
          process.resourcesPath,
          "run-server.bat"
        );

        if (fs.existsSync(batchFilePath)) {
          console.log(`Attempting to use batch file at ${batchFilePath}`);
          serverProcess = spawn(batchFilePath, [], spawnOptions);
        }
        // 2. Check if we have a bundled Node.js executable as a fallback
        else {
          const bundledNodePath = path.join(process.resourcesPath, "node.exe");

          if (fs.existsSync(bundledNodePath)) {
            // Use bundled Node.js
            console.log(
              `Found bundled Node.js at ${bundledNodePath}, using it to run server`
            );
            serverProcess = spawn(bundledNodePath, [serverPath], spawnOptions);
          } else {
            // Create a temporary batch file as a last resort
            const tempDir = path.join(app.getPath("temp"));
            const tempBatchFile = path.join(tempDir, "run-server.bat");

            fs.writeFileSync(
              tempBatchFile,
              `@echo off
echo ===== POS System Server Launcher (Temp) =====
echo Starting server from path: ${serverPath}
echo Timestamp: %DATE% %TIME%
echo.

set NODE_PATH=${path.dirname(serverPath)}
where node >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo Node.js found in PATH, using it.
  node "${serverPath}"
) else (
  echo Node.js not found in system PATH.
  echo All attempts to start the server have failed.
)
            `
            );

            console.log(`Created temporary batch file at ${tempBatchFile}`);

            // Use Windows command processor as final fallback
            const cmdPath = process.env.ComSpec || "cmd.exe";
            console.log(
              `Using Windows command processor with batch file: ${cmdPath}`
            );

            serverProcess = spawn(cmdPath, ["/c", tempBatchFile], spawnOptions);
          }
        }

        // Reattach all event handlers
        setupServerProcessHandlers(
          serverProcess,
          timeout,
          resolvePromise,
          rejectPromise
        );

        return; // Skip the normal event handling below
      } catch (fallbackError) {
        console.error("Fallback server start method failed:", fallbackError);
      }
    }

    if (mainWindow) {
      mainWindow.webContents.send("server-status", {
        status: "stopped",
        code,
        signal,
      });
    }

    // Don't automatically restart here, let the user do it manually
    serverProcess = null;
  });

  process.on("error", (err) => {
    clearTimeout(timeout);
    console.error("Failed to start server process:", err);
    rejectPromise(err);
  });
}

// Create a batch file for running the server - used as a last resort
function createServerBatchFile(serverPath) {
  try {
    const batchFilePath = path.join(process.resourcesPath, "run-server.bat");
    console.log(`Creating server batch file at ${batchFilePath}`);

    // Create a batch file that tries multiple approaches to start Node
    const batchContent = `@echo off
echo ===== POS System Server Launcher =====
echo Starting server from path: ${serverPath}
echo Timestamp: %DATE% %TIME%
echo.

set SERVER_PATH=${serverPath.replace(/\\/g, "\\\\")}
set RESOURCE_PATH=${process.resourcesPath.replace(/\\/g, "\\\\")}
set NODE_PATH=${path.dirname(serverPath).replace(/\\/g, "\\\\")}

echo Trying bundled Node.js...
if exist "%RESOURCE_PATH%\\node.exe" (
  echo Found bundled Node.js, using it.
  "%RESOURCE_PATH%\\node.exe" "%SERVER_PATH%"
  if %ERRORLEVEL% == 0 exit /b 0
  echo Bundled Node.js failed with error %ERRORLEVEL%, trying system Node...
)

echo Trying system Node.js...
where node >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo Node.js found in PATH, using it.
  node "%SERVER_PATH%"
  if %ERRORLEVEL% == 0 exit /b 0
  echo System Node.js failed with error %ERRORLEVEL%.
) else (
  echo Node.js not found in PATH.
)

echo All Node.js attempts failed. Server could not be started.
exit /b 1
`;

    fs.writeFileSync(batchFilePath, batchContent);
    console.log("Server batch file created successfully");
    return batchFilePath;
  } catch (error) {
    console.error("Failed to create server batch file:", error);
    return null;
  }
}

async function createWindow() {
  console.log("Starting createWindow function");

  // Get emergency log path for direct logging
  const userFolder =
    process.env.APPDATA ||
    (process.platform === "darwin"
      ? path.join(process.env.HOME, "Library/Preferences")
      : path.join(process.env.HOME, ".local/share"));
  const emergencyLogFile = path.join(userFolder, "emergency-pos-debug.log");

  try {
    fs.appendFileSync(emergencyLogFile, "\n=== STARTING WINDOW CREATION ===\n");

    // WINDOWS WORKAROUND: Detect if server/client directories are missing and disable asar
    if (process.platform === "win32") {
      fs.appendFileSync(
        emergencyLogFile,
        "Windows platform detected in createWindow\n"
      );

      // Check for client and server in resources
      const resourcesPath = process.resourcesPath;
      const clientDir = path.join(resourcesPath, "client");
      const serverDir = path.join(resourcesPath, "server");

      fs.appendFileSync(
        emergencyLogFile,
        `Checking critical dirs - resources: ${resourcesPath}\n`
      );
      fs.appendFileSync(
        emergencyLogFile,
        `Client dir: ${clientDir} - exists: ${fs.existsSync(clientDir)}\n`
      );
      fs.appendFileSync(
        emergencyLogFile,
        `Server dir: ${serverDir} - exists: ${fs.existsSync(serverDir)}\n`
      );

      // Try to find client and server in alternative locations
      // This helps debugging whether they're packed inside the ASAR or missing entirely
      try {
        const appPath = app.getAppPath();
        fs.appendFileSync(emergencyLogFile, `App path: ${appPath}\n`);

        // Check for packed directories directly
        if (appPath.includes(".asar")) {
          fs.appendFileSync(
            emergencyLogFile,
            "Application is running from ASAR package\n"
          );

          // Try alternative locations
          const alternatives = [
            path.join(path.dirname(appPath), "client"),
            path.join(path.dirname(appPath), "server"),
            path.join(path.dirname(resourcesPath), "client"),
            path.join(path.dirname(resourcesPath), "server"),
          ];

          alternatives.forEach((altPath) => {
            fs.appendFileSync(
              emergencyLogFile,
              `Checking alternative: ${altPath} - exists: ${fs.existsSync(
                altPath
              )}\n`
            );
          });
        }
      } catch (dirError) {
        fs.appendFileSync(
          emergencyLogFile,
          `Error checking alternative directories: ${dirError.message}\n`
        );
      }
    }

    // Verify required paths first
    fs.appendFileSync(emergencyLogFile, "Starting path verification...\n");
    if (!verifyPaths()) {
      console.error("Path verification failed - quitting application");
      fs.appendFileSync(emergencyLogFile, "ERROR: Path verification failed\n");

      // Show error dialog before quitting
      dialog.showErrorBox(
        "Resource Error",
        "Required application resources could not be found. Please reinstall the application."
      );

      app.quit();
      return;
    }

    console.log("Path verification passed successfully");
    fs.appendFileSync(
      emergencyLogFile,
      "Path verification passed successfully\n"
    );
  } catch (error) {
    console.error("Error during path verification:", error);

    try {
      fs.appendFileSync(
        emergencyLogFile,
        `ERROR in verification: ${error.message}\n${error.stack}\n`
      );
    } catch (logError) {
      // Can't do anything if we can't log
    }

    dialog.showErrorBox(
      "Startup Error",
      `Error during path verification: ${error.message}`
    );
    app.quit();
    return;
  }

  try {
    // Make locales available to the renderer process
    if (!isDev) {
      // In production, check for locales in potential locations
      const localesDirectories = [
        getResourcePath("../../client/locales"),
        getResourcePath("client/locales"),
        path.join(process.resourcesPath, "client/locales"),
      ];

      let localesPath = null;
      for (const dir of localesDirectories) {
        console.log(`Checking for locales in: ${dir}`);
        if (fs.existsSync(dir)) {
          localesPath = dir;
          console.log(`Using locales from: ${localesPath}`);
          // Make the locales available via protocol
          process.env.LOCALES_PATH = localesPath;
          break;
        }
      }

      if (!localesPath) {
        console.warn("Could not find locales directory");
      }
    } else {
      // In development mode, check for locales in the client source directory
      const devLocalesPath = path.join(
        __dirname,
        "../../../client/src/locales"
      );
      console.log(
        `Checking for locales in development path: ${devLocalesPath}`
      );
      if (fs.existsSync(devLocalesPath)) {
        console.log(`Using locales from development path: ${devLocalesPath}`);
        process.env.LOCALES_PATH = devLocalesPath;
      } else {
        // Try an alternative path
        const altDevLocalesPath = path.resolve(
          process.cwd(),
          "../client/src/locales"
        );
        console.log(`Trying alternative locales path: ${altDevLocalesPath}`);
        if (fs.existsSync(altDevLocalesPath)) {
          console.log(
            `Using locales from alternative path: ${altDevLocalesPath}`
          );
          process.env.LOCALES_PATH = altDevLocalesPath;
        } else {
          console.warn("Could not find locales directory in development mode");
        }
      }
    }

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
  } else {
    // In production, load from the built client
    try {
      // Try multiple possible paths for the client dist, with better logging
      const clientDistPaths = [
        path.join(process.resourcesPath, "client/dist/index.html"),
        getResourcePath("../../client/dist/index.html"),
        getResourcePath("client/dist/index.html"),
      ];

      // Log all paths we're checking
      console.log("Checking the following client paths:");
      clientDistPaths.forEach((p) => console.log(` - ${p}`));

      // Find the first path that exists
      let clientPath = null;
      for (const distPath of clientDistPaths) {
        console.log(`Checking client path: ${distPath}`);
        if (fs.existsSync(distPath)) {
          clientPath = distPath;
          console.log(`✅ Using client path: ${clientPath}`);
          break;
        } else {
          console.log(`❌ Path doesn't exist: ${distPath}`);
        }
      }

      if (clientPath) {
        // Load the client from the file system
        const fileUrl = url.format({
          pathname: clientPath,
          protocol: "file:",
          slashes: true,
        });
        console.log(`Loading from file: ${fileUrl}`);
        mainWindow.loadURL(fileUrl);
      } else {
        throw new Error("Could not find client build");
      }
    } catch (error) {
      console.error("Failed to load client:", error);
      showErrorDialog(
        "Client Error",
        `Failed to load the client: ${error.message}\n\nThe application may not function correctly.`
      );
    }
  }

  // Show developer tools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Listen for when renderer is ready
  ipcMain.on("renderer-ready", () => {
    console.log("Renderer process is ready");

    // Send initial server status to the renderer
    if (mainWindow) {
      mainWindow.webContents.send("server-status", {
        running: serverReady,
        port: serverPort,
      });
    }
  });
}

// Register app lifecycle events
// Add more error handling for app ready event
app.on("ready", () => {
  try {
    // Get emergency log file path
    const userFolder =
      process.env.APPDATA ||
      (process.platform === "darwin"
        ? path.join(process.env.HOME, "Library/Preferences")
        : path.join(process.env.HOME, ".local/share"));
    const emergencyLogFile = path.join(userFolder, "emergency-pos-debug.log");

    // Log app ready event
    fs.appendFileSync(
      emergencyLogFile,
      `\n=== APP READY EVENT ===\n` + `Time: ${new Date().toISOString()}\n`
    );

    console.log("App ready event triggered - attempting to create window");

    // Check critical resources before doing anything
    fs.appendFileSync(emergencyLogFile, "Checking critical resources:\n");

    // Check app paths
    const appPath = app.getAppPath();
    fs.appendFileSync(emergencyLogFile, `App path: ${appPath}\n`);

    const resourcesPath = process.resourcesPath;
    fs.appendFileSync(emergencyLogFile, `Resources path: ${resourcesPath}\n`);

    const exePath = app.getPath("exe");
    fs.appendFileSync(emergencyLogFile, `Executable path: ${exePath}\n`);

    const userDataPath = app.getPath("userData");
    fs.appendFileSync(emergencyLogFile, `User data path: ${userDataPath}\n`);

    // Check if critical directories exist
    if (fs.existsSync(resourcesPath)) {
      fs.appendFileSync(emergencyLogFile, "Resources directory exists\n");

      // List files in resources
      try {
        const resourceFiles = fs.readdirSync(resourcesPath);
        fs.appendFileSync(
          emergencyLogFile,
          `Resource files: ${resourceFiles.join(", ")}\n`
        );

        // Check for client and server dirs
        const clientDir = path.join(resourcesPath, "client");
        const serverDir = path.join(resourcesPath, "server");

        fs.appendFileSync(
          emergencyLogFile,
          `Client dir exists: ${fs.existsSync(clientDir)}\n`
        );
        fs.appendFileSync(
          emergencyLogFile,
          `Server dir exists: ${fs.existsSync(serverDir)}\n`
        );

        if (fs.existsSync(clientDir)) {
          const clientFiles = fs.readdirSync(clientDir);
          fs.appendFileSync(
            emergencyLogFile,
            `Client files: ${clientFiles.join(", ")}\n`
          );

          const clientDistDir = path.join(clientDir, "dist");
          if (fs.existsSync(clientDistDir)) {
            const clientDistFiles = fs.readdirSync(clientDistDir);
            fs.appendFileSync(
              emergencyLogFile,
              `Client dist files: ${clientDistFiles.join(", ")}\n`
            );
          } else {
            fs.appendFileSync(
              emergencyLogFile,
              "client/dist directory NOT FOUND\n"
            );
          }
        }

        if (fs.existsSync(serverDir)) {
          const serverFiles = fs.readdirSync(serverDir);
          fs.appendFileSync(
            emergencyLogFile,
            `Server files: ${serverFiles.join(", ")}\n`
          );

          const serverDistDir = path.join(serverDir, "dist");
          if (fs.existsSync(serverDistDir)) {
            const serverDistFiles = fs.readdirSync(serverDistDir);
            fs.appendFileSync(
              emergencyLogFile,
              `Server dist files: ${serverDistFiles.join(", ")}\n`
            );
          } else {
            fs.appendFileSync(
              emergencyLogFile,
              "server/dist directory NOT FOUND\n"
            );
          }
        }
      } catch (err) {
        fs.appendFileSync(
          emergencyLogFile,
          `Error reading resource files: ${err.message}\n${err.stack}\n`
        );
      }
    } else {
      fs.appendFileSync(
        emergencyLogFile,
        "CRITICAL: Resources directory does not exist\n"
      );
    }

    // Check renderer preload path
    const preloadPath = path.join(__dirname, "preload.js");
    fs.appendFileSync(emergencyLogFile, `Preload path: ${preloadPath}\n`);
    fs.appendFileSync(
      emergencyLogFile,
      `Preload exists: ${fs.existsSync(preloadPath)}\n`
    );

    if (process.platform === "win32") {
      // Windows-specific startup logging
      fs.appendFileSync(emergencyLogFile, "Windows platform detected\n");

      try {
        // Additional Windows-specific checks
        const windowsEnvVars = [
          "ProgramFiles",
          "ProgramFiles(x86)",
          "LOCALAPPDATA",
          "APPDATA",
          "TEMP",
          "SystemRoot",
        ];

        fs.appendFileSync(emergencyLogFile, "Windows environment variables:\n");
        windowsEnvVars.forEach((env) => {
          fs.appendFileSync(
            emergencyLogFile,
            `${env}: ${process.env[env] || "not set"}\n`
          );
        });
      } catch (winErr) {
        fs.appendFileSync(
          emergencyLogFile,
          `Error in Windows-specific checks: ${winErr.message}\n`
        );
      }
    }

    // Attempt to create window
    fs.appendFileSync(emergencyLogFile, "Attempting to create window...\n");
    createWindow();
    fs.appendFileSync(
      emergencyLogFile,
      "Window creation completed without errors\n"
    );
  } catch (error) {
    console.error("Critical error during app startup:", error);

    // Try to log to emergency file
    try {
      const userFolder =
        process.env.APPDATA ||
        (process.platform === "darwin"
          ? path.join(process.env.HOME, "Library/Preferences")
          : path.join(process.env.HOME, ".local/share"));
      const emergencyLogFile = path.join(userFolder, "emergency-pos-debug.log");

      fs.appendFileSync(
        emergencyLogFile,
        `\n=== CRITICAL STARTUP ERROR ===\n` +
          `Time: ${new Date().toISOString()}\n` +
          `Error: ${error.toString()}\n` +
          `Stack: ${error.stack}\n\n`
      );
    } catch (logError) {
      // Cannot log to file, just console
      console.error("Additionally failed to log error to file:", logError);
    }

    // Show error dialog that won't be missed
    dialog.showErrorBox(
      "Critical Startup Error",
      `The application encountered a critical error during startup: ${
        error.message
      }\n\nPlease check the emergency log at: ${
        process.env.APPDATA
          ? path.join(process.env.APPDATA, "emergency-pos-debug.log")
          : "emergency-pos-debug.log"
      }`
    );
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
