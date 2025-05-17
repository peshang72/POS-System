#!/bin/bash

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Ensure Node.js is downloaded and verified only once
echo "📥 Checking and downloading Node.js for Windows if needed..."
npm run download-node-once

# Source env variables if exists
if [ -f env-load.sh ]; then
  echo "Loading environment variables..."
  source ./env-load.sh
fi

# Prepare server modules and fix express
echo "🔧 Preparing server modules..."
npm run prepare-server-modules
npm run fix-server-express

# Run the publish command with windows-builder.yml
echo "🚀 Publishing Windows build..."
NODE_OPTIONS="--no-deprecation" npx electron-builder --win --publish always --config windows-builder.yml

# Copy server modules after build
echo "📋 Copying and verifying server modules..."
npm run copy-server-modules
npm run verify-server-modules

# Analyze build structure
echo "🔍 Analyzing final build structure..."
npm run check-build

echo "✅ Windows build published successfully" 