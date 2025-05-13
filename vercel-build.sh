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
npm install

# Make sure we have compatible Vite and plugin-react versions
echo "=== Installing Vite ${VITE_VERSION} and plugin-react ${PLUGIN_REACT_VERSION} ==="
npm install vite@${VITE_VERSION} @vitejs/plugin-react@${PLUGIN_REACT_VERSION} --save-dev

# Check if vite is installed correctly
echo "=== Checking Vite installation ==="
ls -la node_modules/.bin/vite || echo "Vite not found in node_modules/.bin"
ls -la node_modules/vite || echo "Vite directory not found in node_modules"

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

# Build the client - use node_modules directly
echo "=== Building client application ==="
./node_modules/.bin/vite build || node ./node_modules/vite/bin/vite.js build
cd ..

# Install API dependencies
echo "=== Installing API dependencies ==="
cd api
npm install
cd ..

echo "=== Build completed successfully ===" 