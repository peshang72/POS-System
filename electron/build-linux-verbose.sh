#!/bin/bash

# Exit on error
set -e

# Print commands before executing them
set -x

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Enable verbose output for electron-builder
export DEBUG=electron-builder

# Build client
echo "Building client..."
cd ../client
npm run build

# Build server
echo "Building server..."
cd ../server
npm run build

# Return to electron directory
cd "$SCRIPT_DIR"

# Fix dependencies
echo "Fixing dependencies..."
node fix-deps.js

# Set necessary environment variables
export ELECTRON_DISABLE_GPU=1
export ELECTRON_DISABLE_SANDBOX=1
export LIBVA_DRIVER_NAME=dummy

# Ensure extraResources are properly included
echo "Verifying resources directories..."
echo "Client dist path: $(realpath ../client/dist)"
echo "Server dist path: $(realpath ../server/dist)"
echo "Client locales path: $(realpath ../client/src/locales)"

if [ ! -d "../client/dist" ]; then
  echo "ERROR: Client build not found!"
  exit 1
fi

if [ ! -d "../server/dist" ]; then
  echo "ERROR: Server build not found!"
  exit 1
fi

# Print current system information
echo "System information:"
uname -a
id

# Print available disk space
echo "Available disk space:"
df -h

# Print environment variables
echo "Environment variables:"
env | sort

# Build Electron app specifically for Linux with both AppImage and DEB formats
echo "Building Linux packages (AppImage and DEB)..."
NODE_OPTIONS="--no-deprecation --trace-warnings" node_modules/.bin/electron-builder --linux AppImage deb --config electron-builder.yml --verbose

echo "Build completed! Check the dist/ directory for the Linux installers."

# List the contents of the dist directory
echo "Contents of dist directory:"
ls -la dist/ 