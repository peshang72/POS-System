#!/bin/bash

# Exit on error
set -e

# Print colored text
print_colored() {
  local color=$1
  local text=$2
  
  case $color in
    "red") echo -e "\e[31m$text\e[0m" ;;
    "green") echo -e "\e[32m$text\e[0m" ;;
    "yellow") echo -e "\e[33m$text\e[0m" ;;
    "blue") echo -e "\e[34m$text\e[0m" ;;
    "magenta") echo -e "\e[35m$text\e[0m" ;;
    "cyan") echo -e "\e[36m$text\e[0m" ;;
    *) echo "$text" ;;
  esac
}

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_colored "cyan" "🚀 Rebuilding POS System for Windows with Windows-specific Fixes"
print_colored "cyan" "======================================"

# Ensure output directory exists and is empty
print_colored "blue" "Clearing previous build artifacts..."
rm -rf dist/
mkdir -p dist
print_colored "green" "✅ Build directory prepared"

# Ensure src directory exists with our main.js file
if [ ! -d "src" ]; then
  print_colored "red" "❌ src directory missing. Script must be run from the electron directory."
  exit 1
fi

# Set necessary environment variables
export ELECTRON_DISABLE_GPU=1
export ELECTRON_DISABLE_SANDBOX=1
export NODE_ENV=production

print_colored "blue" "Setting up build environment..."
# Additional environment variables for building
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_ENABLE_STACK_DUMPING=1
export ELECTRON_NO_ATTACH_CONSOLE=1
export ELECTRON_DISABLE_SECURITY_WARNINGS=1
export CSC_IDENTITY_AUTO_DISCOVERY=false  # Skip code signing

# Create Windows-specific version of preload.js with enhanced error handling
print_colored "blue" "Creating enhanced preload.js for Windows..."
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

print_colored "green" "✅ Enhanced preload.js created for Windows"

# Use the Windows-specific preload.js
cp src/preload-windows.js src/preload.js
print_colored "green" "✅ Preload.js replaced with Windows-enhanced version"

# Build client
print_colored "blue" "Building client..."
cd ../client
npm run build
print_colored "green" "✅ Client built successfully"

# Build server
print_colored "blue" "Building server..."
cd ../server
npm run build
print_colored "green" "✅ Server built successfully"

# Return to electron directory
cd "$SCRIPT_DIR"

# Debug: Verify directories exist before packaging
CLIENT_DIST="$SCRIPT_DIR/../client/dist"
SERVER_DIST="$SCRIPT_DIR/../server/dist"
CLIENT_LOCALES="$SCRIPT_DIR/../client/src/locales"

print_colored "blue" "Verifying required directories..."
if [ -d "$CLIENT_DIST" ]; then
    print_colored "green" "✅ Client dist directory exists: $CLIENT_DIST"
    ls -la "$CLIENT_DIST" | head -n 10
else
    print_colored "red" "❌ Client dist directory missing: $CLIENT_DIST"
    exit 1
fi

if [ -d "$SERVER_DIST" ]; then
    print_colored "green" "✅ Server dist directory exists: $SERVER_DIST"
    ls -la "$SERVER_DIST" | head -n 10
else
    print_colored "red" "❌ Server dist directory missing: $SERVER_DIST"
    exit 1
fi

if [ -d "$CLIENT_LOCALES" ]; then
    print_colored "green" "✅ Client locales directory exists: $CLIENT_LOCALES"
    ls -la "$CLIENT_LOCALES" | head -n 10
else
    print_colored "yellow" "⚠️ Client locales directory missing: $CLIENT_LOCALES"
fi

# Fix dependencies
print_colored "blue" "Fixing dependencies..."
node fix-deps.js
print_colored "green" "✅ Dependencies fixed"

# Create a modified electron-builder config with absolute paths
print_colored "blue" "Creating modified electron-builder config with absolute paths..."
cat > windows-builder.yml <<EOL
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
  - from: ${CLIENT_DIST}
    to: client/dist
  - from: ${SERVER_DIST}
    to: server/dist
  - from: ${CLIENT_LOCALES}
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
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "Gaming POS System"
  runAfterFinish: true
  menuCategory: "POS System"
  artifactName: "Gaming-POS-System-Setup-\${version}.exe"

publish:
  provider: github
  owner: peshang72
  repo: POS-System
EOL

# Build the Windows unpacked directory first using the modified config
print_colored "magenta" "⚙️ Building Windows unpacked files..."
NODE_OPTIONS="--no-deprecation" npx electron-builder --win --dir --config windows-builder.yml

# Verify resources were correctly copied
print_colored "blue" "Verifying resources were correctly copied..."
if [ -d "dist/win-unpacked/resources" ]; then
    print_colored "green" "✅ Resources directory exists"
    ls -la dist/win-unpacked/resources/
    
    # Check for client & server directories
    if [ -d "dist/win-unpacked/resources/client" ]; then
        print_colored "green" "✅ Client directory exists in resources"
        ls -la dist/win-unpacked/resources/client/
    else
        print_colored "red" "❌ Client directory missing in resources"
    fi
    
    if [ -d "dist/win-unpacked/resources/server" ]; then
        print_colored "green" "✅ Server directory exists in resources"
        ls -la dist/win-unpacked/resources/server/
    else
        print_colored "red" "❌ Server directory missing in resources"
    fi
else
    print_colored "red" "❌ Resources directory missing"
fi

# Then create the NSIS installer from the unpacked directory
if [ -d "dist/win-unpacked" ]; then
    print_colored "magenta" "⚙️ Creating Windows installer from unpacked files..."
    NODE_OPTIONS="--no-deprecation" npx electron-builder --win nsis --prepackaged dist/win-unpacked --config windows-builder.yml
    
    # Verify the build was created
    if [ -f "dist"/*.exe ]; then
        print_colored "green" "✅ Windows installer created successfully!"
    else
        print_colored "yellow" "⚠️ Installer not created. Using the unpacked directory as final output."
        print_colored "green" "✅ Windows application built (unpacked) successfully!"
    fi
else
    print_colored "red" "❌ Error: Windows unpacked directory wasn't created successfully."
    exit 1
fi

print_colored "cyan" "======================================"
print_colored "green" "🎉 Build completed! Check the dist/ directory for the Windows build:"
ls -la dist/ | grep -E "win-unpacked|\\.exe$" | while read line; do
    print_colored "cyan" "  $line"
done 

print_colored "yellow" "⚠️ IMPORTANT: After installing on Windows:"
print_colored "yellow" "1. Make sure to allow the app through Windows Firewall if prompted"
print_colored "yellow" "2. Check the logs at %APPDATA%\\Gaming POS System\\app-startup.log if issues persist"
print_colored "yellow" "3. Check the logs at %APPDATA%\\Gaming POS System\\renderer-log.txt for client errors" 