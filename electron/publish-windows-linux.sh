#!/bin/bash

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create a config for building on Linux without resource editing (rcedit)
echo "Creating config for building on Linux..."
cat > linux-win-builder.yml <<EOL
appId: com.gaming.pos
productName: Gaming POS System
copyright: Copyright © 2023

directories:
  output: dist
  buildResources: assets

files:
  - src/**/*
  - package.json
  - node_modules/**
  - "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
  - "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}"
  - "!node_modules/*.d.ts"
  - "!node_modules/.bin"
  - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"
  - "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}"
  - "!**/{appveyor.yml,.travis.yml,circle.yml}"
  - "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
  - assets/node.exe
  - extraResources/node.exe
  - resources/node.exe

extraResources:
  - from: ../client/dist
    to: client/dist
  - from: ../server/dist
    to: server/dist
  - from: ../client/src/locales
    to: client/locales
  - from: "resources/node.exe"
    to: "node.exe"
  - from: "extraResources/node.exe"
    to: "node.exe"
  - from: "assets/node.exe"
    to: "node.exe"

asar: true

win:
  icon: assets/Profile.ico
  target:
    - target: nsis
      arch:
        - x64
  # Disable resource editing on Linux
  executableMetadata: false
  extraFiles:
    - from: "resources/node.exe"
      to: "resources/node.exe"
    - from: "extraResources/node.exe"
      to: "resources/node.exe"
    - from: "assets/node.exe"
      to: "resources/node.exe"

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  shortcutName: "Gaming POS System"
  runAfterFinish: true
  menuCategory: "POS System"
  artifactName: "Gaming-POS-System-Setup-\${version}.exe"

publish:
  provider: github
  owner: peshang72
  repo: POS-System
EOL

# Build client and server
echo "🚀 Building client and server..."
cd ../client
npm run build
cd ../server
npm run build
cd "$SCRIPT_DIR"

# Ensure our Windows-specific fixes are applied to main.js and apiConfig.js
echo "Creating Windows-enhanced preload.js..."
cat > src/preload-windows.js <<EOL
const { contextBridge, ipcRenderer } = require("electron");
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set up logging to file for the renderer process
const logFile = path.join(os.homedir(), 'AppData', 'Roaming', 'Gaming POS System', 'renderer-log.txt');

// Create a function to write to the log file
function writeToLogFile(message) {
  try {
    fs.appendFileSync(logFile, \`\${new Date().toISOString()} - \${message}\n\`);
  } catch (error) {
    console.error(\`Failed to write to log file: \${error.message}\`);
  }
}

// Override console methods in the renderer process
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile(\`[LOG] \${message}\`);
  originalConsoleLog.apply(console, args);
};

console.error = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile(\`[ERROR] \${message}\`);
  originalConsoleError.apply(console, args);
};

console.warn = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile(\`[WARN] \${message}\`);
  originalConsoleWarn.apply(console, args);
};

// Clear log file at startup to avoid it growing too large
try {
  fs.writeFileSync(logFile, \`=== Renderer process started at \${new Date().toISOString()} ===\n\`);
  console.log(\`Renderer logging to file: \${logFile}\`);
} catch (error) {
  console.error(\`Failed to initialize renderer log file: \${error.message}\`);
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
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes \`sender\`
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
        console.error(\`Error invoking \${channel}:\`, error);
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
    openDevTools: () => ipcRenderer.send('open-dev-tools'),
    checkServerConnection: () => ipcRenderer.invoke('check-server-connection'),
  }
});

// Signal to renderer process that preload script has executed
window.addEventListener("DOMContentLoaded", () => {
  try {
    // Let main process know renderer is ready
    console.log('DOM Content Loaded - sending renderer-ready event');
    ipcRenderer.send("renderer-ready", { timestamp: Date.now() });
  } catch (error) {
    console.error('Error in DOMContentLoaded event:', error);
  }
});
EOL

# Use the enhanced preload.js
cp src/preload-windows.js src/preload.js
echo "✅ Enhanced preload.js applied"

# Fix dependencies
echo "Fixing dependencies..."
node fix-deps.js

# Clear dist directory
rm -rf dist/
mkdir -p dist

# Build the Windows app
echo "🚀 Building and publishing Windows app..."
CSC_IDENTITY_AUTO_DISCOVERY=false NODE_OPTIONS="--no-deprecation" npx electron-builder --win --publish always --config linux-win-builder.yml

echo "✅ Windows build completed and published"
echo "Check GitHub releases for the published version" 