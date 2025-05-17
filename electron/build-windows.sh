#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if node and npm are installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm and try again."
    exit 1
fi

# Load environment variables if env-load.sh exists
if [ -f ./env-load.sh ]; then
    source ./env-load.sh
    log "Loaded environment variables from env-load.sh"
else
    warn "env-load.sh not found, continuing without loading environment variables"
fi

# Default to building server and client if no arguments provided
BUILD_SERVER=true
BUILD_CLIENT=true
BUILD_ELECTRON=true
SKIP_CLEAN=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-server) BUILD_SERVER=false ;;
        --skip-client) BUILD_CLIENT=false ;;
        --skip-electron) BUILD_ELECTRON=false ;;
        --skip-clean) SKIP_CLEAN=true ;;
        *) error "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to build the server
build_server() {
    log "Building server..."
    cd ../server || exit
    npm ci
    npm run build
    if [ $? -ne 0 ]; then
        error "Server build failed"
        exit 1
    fi
    log "Server build completed successfully"
    cd ../electron || exit
}

# Function to build the client
build_client() {
    log "Building client..."
    cd ../client || exit
    npm ci
    npm run build
    if [ $? -ne 0 ]; then
        error "Client build failed"
        exit 1
    fi
    log "Client build completed successfully"
    cd ../electron || exit
}

# Function to build Electron app
build_electron() {
    log "Building Electron app..."
    # Download Node.js for Windows first
    npm run download-node-windows
    if [ $? -ne 0 ]; then
        error "Failed to download Node.js for Windows"
        exit 1
    fi
    log "Downloaded Node.js for Windows successfully"
    
    # Clean up previous builds if not skipped
    if [ "$SKIP_CLEAN" = false ]; then
        log "Cleaning previous builds..."
        rm -rf dist
    fi
    
    # Install dependencies
    npm ci
    
    # Build for Windows
    npm run build:windows
    if [ $? -ne 0 ]; then
        error "Electron build failed"
        exit 1
    fi
    log "Electron build completed successfully"
}

# Main build process
if [ "$BUILD_SERVER" = true ]; then
    build_server
fi

if [ "$BUILD_CLIENT" = true ]; then
    build_client
fi

if [ "$BUILD_ELECTRON" = true ]; then
    build_electron
fi

log "Build process completed successfully"

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

print_colored "cyan" "🚀 Building POS System for Windows"
print_colored "cyan" "======================================"

# Ensure output directory exists and is empty
print_colored "blue" "Clearing previous build artifacts..."
rm -rf dist/
mkdir -p dist
print_colored "green" "✅ Build directory prepared"

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

# Fix server dependencies
print_colored "blue" "Installing server dependencies..."
./fix-server-modules.sh
print_colored "green" "✅ Server dependencies installed successfully"

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

# Prepare server resources manually
print_colored "blue" "Preparing server resources manually..."
RESOURCES_DIR="$SCRIPT_DIR/resources"
SERVER_RESOURCES_DIR="$RESOURCES_DIR/server/dist"
CLIENT_RESOURCES_DIR="$RESOURCES_DIR/client/dist"

# Create directories
mkdir -p "$SERVER_RESOURCES_DIR/node_modules"
mkdir -p "$CLIENT_RESOURCES_DIR"

# Copy server files
cp -r "$SERVER_DIST"/* "$SERVER_RESOURCES_DIR/"
cp -r "$SERVER_DIST/node_modules" "$SERVER_RESOURCES_DIR/"
print_colored "green" "✅ Server files copied to resources"

# Copy client files
cp -r "$CLIENT_DIST"/* "$CLIENT_RESOURCES_DIR/"
print_colored "green" "✅ Client files copied to resources"

# Copy node.exe
cp "$SCRIPT_DIR/assets/node.exe" "$RESOURCES_DIR/node.exe"
print_colored "green" "✅ Node.exe copied to resources"

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
  - resources/**/*
  - assets/node.exe
  - extraResources/node.exe
  - resources/node.exe

extraResources:
  - from: ${CLIENT_DIST}
    to: client/dist
  - from: ${SERVER_DIST}
    to: server/dist
  - from: ${SERVER_DIST}/node_modules
    to: server/dist/node_modules
  - from: ${CLIENT_LOCALES}
    to: client/locales
  - from: "resources/node.exe"
    to: "node.exe"
  - from: "extraResources/node.exe"
    to: "node.exe"
  - from: "assets/node.exe"
    to: "node.exe"

asarUnpack:
  - "resources/**/*"
  - "server/**/*"
  - "client/**/*"
  - "node_modules/**/*"
  - "resources/node.exe"
  - "resources/server/dist/node_modules"

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
    - from: ${SERVER_DIST}/node_modules
      to: "resources/server/dist/node_modules"

publish:
  provider: github
  owner: peshang72
  repo: POS-System
EOL

# Ensure server dependencies are properly installed and will be included in build
print_colored "blue" "Running enhanced server dependency fix script..."
node fix-server-express.js
print_colored "green" "✅ Server dependencies properly configured"

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
        
        # Check for server node_modules
        if [ -d "dist/win-unpacked/resources/server/dist/node_modules" ]; then
            print_colored "green" "✅ Server node_modules directory exists"
            ls -la dist/win-unpacked/resources/server/dist/node_modules/ | grep express
            print_colored "green" "Express module found: $(ls -la dist/win-unpacked/resources/server/dist/node_modules/ | grep -c express)"
        else
            print_colored "red" "❌ Server node_modules directory missing!"
            print_colored "yellow" "Attempting emergency fix..."
            
            # Run our enhanced server dependency fix script again for the unpacked build
            print_colored "blue" "Running emergency server dependency fix..."
            node fix-server-express.js
            
            # Manual copy as last resort
            mkdir -p dist/win-unpacked/resources/server/dist/node_modules
            cp -r ../server/dist/node_modules/* dist/win-unpacked/resources/server/dist/node_modules/ || true
            
            if [ -d "dist/win-unpacked/resources/server/dist/node_modules/express" ]; then
                print_colored "green" "✅ Express module now exists"
            else
                print_colored "red" "❌ Express module still missing after emergency fix"
            fi
        fi
    else
        print_colored "red" "❌ Server directory missing in resources"
    fi
else
    print_colored "red" "❌ Resources directory missing"
    
    # Emergency resource creation
    print_colored "yellow" "⚠️ Creating resources directory as emergency fix..."
    mkdir -p dist/win-unpacked/resources/server/dist/node_modules
    mkdir -p dist/win-unpacked/resources/client/dist
    
    # Copy server files including node_modules
    cp -r ../server/dist/* dist/win-unpacked/resources/server/dist/
    cp -r ../server/dist/node_modules/* dist/win-unpacked/resources/server/dist/node_modules/
    
    # Copy client files
    cp -r ../client/dist/* dist/win-unpacked/resources/client/dist/
    
    # Copy node.exe
    cp assets/node.exe dist/win-unpacked/resources/node.exe
    
    print_colored "green" "✅ Emergency resource creation completed"
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