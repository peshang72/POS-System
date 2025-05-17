#!/bin/bash

# Exit on error
set -e

# Print commands before executing them
set -x

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

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

# Build Electron app
echo "Building Electron app..."
npm run build

echo "Build completed! Check the dist/ directory for the installer."
