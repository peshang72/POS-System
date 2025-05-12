#!/bin/bash

# Deployment script for POS System
echo "📦 POS System Deployment"

# Stop any running Node.js processes
echo "🛑 Stopping any running Node.js processes..."
pkill -f "node" || true

# Change to the project root directory
cd "$(dirname "$0")"

# Build the client
echo "🏗️ Building client..."
cd client
npm run build
cd ..

# Start the server
echo "🚀 Starting server..."
cd server
node src/index.js

# Get the IP address
HOST_IP=$(hostname -I | awk '{print $1}')
echo "🌐 Server running at http://$HOST_IP:5000"
