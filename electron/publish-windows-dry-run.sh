#!/bin/bash

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Ensure Node.js is downloaded and verified
echo "📥 Downloading and verifying Node.js for Windows..."
npm run download-node-windows
npm run verify-node-windows

# Run the improved build script
./build-windows.sh

# Run a dry-run publish to test configuration
echo "🚀 Running a dry-run Windows publish..."
NODE_OPTIONS="--no-deprecation" npx electron-builder --win --publish never --config windows-builder.yml

echo "✅ Windows dry-run completed successfully" 