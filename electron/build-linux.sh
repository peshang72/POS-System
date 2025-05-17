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

# Check if fuse is available
if [ ! -f "/dev/fuse" ] || [ ! -d "/sys/fs/fuse" ]; then
  echo "Warning: FUSE might not be properly installed or configured. AppImage creation may fail."
  echo "Try running: sudo apt-get install -y libfuse2"
fi

# Build the Linux packages
echo "Building Linux packages..."
NODE_OPTIONS="--no-deprecation" node_modules/.bin/electron-builder --linux --config electron-builder.yml

# If AppImage not found, try explicitly building it
if [ ! -f dist/*.AppImage ]; then
  echo "AppImage not found, trying to build it explicitly..."
  NODE_OPTIONS="--no-deprecation" node_modules/.bin/electron-builder --linux AppImage --config electron-builder.yml
fi

# Create a tarball of the linux-unpacked directory as a fallback
if [ -d "dist/linux-unpacked" ]; then
    echo "Creating tarball of the application as a fallback..."
    APP_VERSION=$(node -p "require('./package.json').version")
    APP_NAME=$(node -p "require('./package.json').name")
    
    TAR_NAME="${APP_NAME}-${APP_VERSION}-linux-x64.tar.gz"
    
    # Create the tarball
    cd dist
    tar czf "${TAR_NAME}" linux-unpacked/
    cd ..
    
    echo "Tarball created: dist/${TAR_NAME}"
else
    echo "Error: Linux build wasn't created successfully."
    exit 1
fi

echo "Build completed! Check the dist/ directory for the Linux package."
ls -la dist/ 