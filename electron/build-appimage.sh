#!/bin/bash

# Exit on error
set -e

# Print commands before executing them
set -x

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set necessary environment variables
export ELECTRON_DISABLE_GPU=1
export ELECTRON_DISABLE_SANDBOX=1
export LIBVA_DRIVER_NAME=dummy
export DEBUG=electron-builder,electron-builder:*,electron-builder:appimage

# Check for FUSE support (required for AppImage)
if [ ! -f "/dev/fuse" ] || [ ! -d "/sys/fs/fuse" ]; then
  echo "Warning: FUSE might not be properly installed or configured. AppImage creation may fail."
  echo "Try running: sudo apt-get install -y libfuse2"
fi

# Install AppImage dependencies 
# Uncomment and run this with sudo if needed:
# sudo apt-get update && sudo apt-get install -y libfuse2

# Check the current architecture
ARCH=$(uname -m)
echo "Building for architecture: $ARCH"

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

# Build only AppImage format
echo "Building AppImage package..."
NODE_OPTIONS="--no-deprecation" node_modules/.bin/electron-builder --linux AppImage --config electron-builder.yml

# Verify AppImage was created
if ls dist/*.AppImage 1> /dev/null 2>&1; then
    echo "✅ AppImage successfully created!"
    ls -la dist/*.AppImage
else
    echo "❌ AppImage creation failed. Check logs for errors."
    echo "Creating a debug build with more verbosity..."
    # Try with more verbosity
    DEBUG=electron-builder NODE_OPTIONS="--no-deprecation --trace-warnings" node_modules/.bin/electron-builder --linux AppImage --config electron-builder.yml
fi

echo "Build process complete."
echo "Contents of dist directory:"
ls -la dist/ 