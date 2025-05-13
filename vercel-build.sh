#!/bin/bash
set -e

echo "=== Vercel Build Script ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set up variables - update to latest compatible versions
VITE_VERSION="5.1.4"
PLUGIN_REACT_VERSION="4.2.1"

# Global install of Vite to ensure it's available
echo "=== Installing Vite globally ==="
npm install -g vite@${VITE_VERSION}

echo "=== Installing client dependencies ==="
cd client

# Show the existing vite.config.js
echo "=== Checking existing vite.config.js ==="
cat vite.config.js

# Normal install of dependencies
npm install

# Build using global Vite
echo "=== Building client with global Vite ==="
export PATH="$(npm bin -g):$PATH"
which vite
vite build
cd ..

# Install API dependencies
echo "=== Installing API dependencies ==="
cd api
npm install
cd ..

echo "=== Build completed successfully ===" 