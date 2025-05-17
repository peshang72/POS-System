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

echo "Building Linux packages..."

# First try with AppImage
NODE_OPTIONS="--no-deprecation" node_modules/.bin/electron-builder --linux AppImage --config electron-builder.yml

# Then try with deb
NODE_OPTIONS="--no-deprecation" node_modules/.bin/electron-builder --linux deb --config electron-builder.yml

echo "Build completed! Check the dist/ directory for the Linux installers."
ls -la dist/ 