#!/bin/bash
set -e

echo "=== Vercel Build Script ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set up variables - update to latest compatible versions
VITE_VERSION="5.1.4"
PLUGIN_REACT_VERSION="4.2.1"

echo "=== Installing client dependencies ==="
cd client

# Debug: Check if package.json exists and what's in it
echo "=== Debug: Current directory and package.json ==="
pwd
ls -la
cat package.json

# Clean installation to ensure correct dependencies
echo "=== Clean npm cache and node_modules ==="
rm -rf node_modules
npm cache clean --force

echo "=== Installing dependencies with explicit paths ==="
npm install
npm install vite@${VITE_VERSION} @vitejs/plugin-react@${PLUGIN_REACT_VERSION} --save-dev

# Debug: Verify installation
echo "=== Verify installation ==="
ls -la node_modules
find node_modules -name "vite" -type d
npm list vite

# Create a minimal vite config
echo "=== Creating minimal Vite config ==="
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
EOL

# Build the client - try alternative approaches
echo "=== Building client application ==="
if [ -f "node_modules/.bin/vite" ]; then
  echo "Using node_modules/.bin/vite"
  ./node_modules/.bin/vite build
elif [ -f "node_modules/vite/bin/vite.js" ]; then
  echo "Using node_modules/vite/bin/vite.js"
  node ./node_modules/vite/bin/vite.js build
else
  echo "Using global npx as fallback"
  npm install -g vite@${VITE_VERSION}
  npx --no-install vite build
fi

cd ..

# Install API dependencies
echo "=== Installing API dependencies ==="
cd api
npm install
cd ..

echo "=== Build completed successfully ===" 