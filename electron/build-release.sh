#!/bin/bash
set -e

# Script to build a complete release with proper client and server builds

echo "=== Starting full build process ==="

# Navigate to project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "=== Building client ==="
cd "$PROJECT_ROOT/client"
npm run build

echo "=== Building server ==="
cd "$PROJECT_ROOT/server"
npm run build

echo "=== Verifying builds exist ==="
if [ ! -f "$PROJECT_ROOT/client/dist/index.html" ]; then
  echo "ERROR: Client build not found! Build failed."
  exit 1
fi

if [ ! -d "$PROJECT_ROOT/server/dist" ]; then
  echo "ERROR: Server build not found! Build failed."
  exit 1
fi

echo "=== Building and publishing Electron app ==="
cd "$PROJECT_ROOT/electron"
npm run publish:linux

echo "=== Build completed successfully ==="
echo "Check your GitHub releases page for the published app." 