const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Set up logging to file for the renderer process
const logFile = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "Gaming POS System",
  "renderer-log.txt"
);

// Create a function to write to the log file
function writeToLogFile(message) {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

// Override console methods in the renderer process
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

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
    `=== Renderer process started at ${new Date().toISOString()} ===\n`
  );
  console.log(`Renderer logging to file: ${logFile}`);
} catch (error) {
  console.error(`Failed to initialize renderer log file: ${error.message}`);
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Send from renderer to main
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ["toMain", "app-event", "renderer-ready"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Receive from main to renderer
  receive: (channel, func) => {
    const validChannels = [
      "fromMain",
      "update-message",
      "app-event",
      "server-status",
      "server-log",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Invoke method from renderer to main and wait for response
  invoke: async (channel, data) => {
    const validChannels = [
      "get-app-path",
      "get-version",
      "check-for-updates",
      "get-server-status",
      "restart-server",
      "get-locales-data",
    ];
    if (validChannels.includes(channel)) {
      try {
        return await ipcRenderer.invoke(channel, data);
      } catch (error) {
        console.error(`Error invoking ${channel}:`, error);
        return { error: error.message };
      }
    }
    return null;
  },
  // Specifically for app updates
  updates: {
    checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
    onUpdateMessage: (callback) => {
      ipcRenderer.on("update-message", (event, message) => callback(message));
    },
    getAppVersion: () => ipcRenderer.invoke("get-version"),
  },
  // Add app information
  appInfo: {
    isElectron: true,
    getVersion: () => ipcRenderer.invoke("get-version"),
    getPlatform: () => process.platform,
  },
  // Server status
  server: {
    getStatus: () => ipcRenderer.invoke("get-server-status"),
    restart: () => ipcRenderer.invoke("restart-server"),
    onStatusChange: (callback) => {
      ipcRenderer.on("server-status", (event, status) => callback(status));
    },
  },
  // Server logs
  serverLogs: {
    onLog: (callback) => {
      ipcRenderer.on("server-log", (event, log) => callback(log));
    },
  },
  // Locales data
  locales: {
    getLocales: async () => {
      try {
        console.log("Preload: Requesting locales from main process");
        const locales = await ipcRenderer.invoke("get-locales-data");
        console.log(
          "Preload: Received locales from main process:",
          locales ? Object.keys(locales) : "No locales"
        );
        return locales;
      } catch (error) {
        console.error("Preload: Error loading locales:", error);
        return null;
      }
    },
  },
  // Windows-specific functions
  windows: {
    openDevTools: () => ipcRenderer.send("open-dev-tools"),
    checkServerConnection: () => ipcRenderer.invoke("check-server-connection"),
  },
});

// Signal to renderer process that preload script has executed
window.addEventListener("DOMContentLoaded", () => {
  try {
    // Let main process know renderer is ready
    console.log("DOM Content Loaded - sending renderer-ready event");
    ipcRenderer.send("renderer-ready", { timestamp: Date.now() });
  } catch (error) {
    console.error("Error in DOMContentLoaded event:", error);
  }
});
