#!/bin/bash
set -e

echo "=== Vercel Build Script ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set up variables
VITE_VERSION="5.0.0"
PLUGIN_REACT_VERSION="4.0.0"

echo "=== Installing client dependencies ==="
cd client
npm install
# Make sure we have a fixed Vite version
echo "=== Installing Vite ${VITE_VERSION} ==="
npm install vite@${VITE_VERSION} @vitejs/plugin-react@${PLUGIN_REACT_VERSION} --save-dev --force

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

# Build the client
echo "=== Building client application ==="
npm exec -- vite build
cd ..

# Install API dependencies
echo "=== Installing API dependencies ==="
cd api
npm install
cd ..

echo "=== Build completed successfully ===" 