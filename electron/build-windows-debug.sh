#!/bin/bash

# Debug build script for Windows installer issues
echo "Building Windows installer with extra debugging enabled..."

# Set environment variables for extra logging
export DEBUG=electron-builder,electron-builder:*,electron-builder:cli
export DEBUG_COLORS=true
export DEBUG_HIDE_DATE=false
export NODE_OPTIONS="--trace-warnings"
export ELECTRON_BUILDER_VERBOSE=true

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/* || true

# Build using windows builder configuration with proper debug settings
echo "Running electron-builder with verbose logging enabled..."
npx electron-builder --win --config windows-builder.yml

echo "Build complete. Check the logs for any errors."
echo "The installer will include detailed logs to help diagnose installation issues." 