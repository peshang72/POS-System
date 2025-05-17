#!/bin/bash

echo "🔧 Installing server dependencies for Windows build..."

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Go to server directory
cd ../server
SERVER_DIR=$(pwd)
echo "Server directory: $SERVER_DIR"

# Ensure dist directory exists
mkdir -p dist

# Copy package.json if it doesn't exist already
if [ ! -f dist/package.json ]; then
  cp package.json dist/
  echo "Copied package.json to dist directory"
fi

# Go to dist directory and install dependencies
cd dist
DIST_DIR=$(pwd)
echo "📦 Installing server dependencies in: $DIST_DIR"

# Make sure npm is available
if command -v npm &> /dev/null; then
  echo "Using npm: $(npm --version)"
else
  echo "❌ npm not found in PATH"
  exit 1
fi

# Install dependencies with --no-bin-links to avoid symlink issues on Windows
echo "Running npm install --production --no-bin-links"
npm install --production --no-bin-links

# Verify node_modules directory was created
if [ -d "node_modules" ]; then
  echo "✅ node_modules directory created successfully"
  echo "Size of node_modules: $(du -sh node_modules | cut -f1)"
  echo "Number of packages: $(find node_modules -maxdepth 1 -type d | wc -l)"
  
  # Check for specific key dependencies
  for pkg in express mongoose bcryptjs jsonwebtoken cors; do
    if [ -d "node_modules/$pkg" ]; then
      echo "✅ Found $pkg package"
    else
      echo "❌ Missing $pkg package"
      # Try to install the specific package if missing
      echo "Attempting to install missing $pkg package..."
      npm install --save --no-bin-links $pkg
    fi
  done
else
  echo "❌ node_modules directory was not created!"
  echo "Attempting emergency fix..."
  npm install express --save --no-bin-links
  exit 1
fi

# Make sure directory is readable and copyable
chmod -R 755 node_modules

# Return to electron directory
cd "$SCRIPT_DIR"

# Ensure server node_modules are properly copied to the build directory if it exists
if [ -d "dist/win-unpacked/resources/server/dist" ]; then
  echo "Copying node_modules to build directory..."
  mkdir -p "dist/win-unpacked/resources/server/dist/node_modules"
  cp -r "$SERVER_DIR/dist/node_modules/"* "dist/win-unpacked/resources/server/dist/node_modules/"
  echo "✅ Copied node_modules to build directory"
fi

echo "🚀 Server dependencies installed successfully" 