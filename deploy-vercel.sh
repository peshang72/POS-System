#!/bin/bash

# Vercel deployment script for POS System

echo "🚀 Starting Vercel deployment process..."

# Step 1: Install Vercel CLI if not already installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Ask deployment method
echo "Select deployment method:"
echo "1) Deploy from GitHub (recommended)"
echo "2) Deploy from local files"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    # GitHub deployment
    echo "Setting up GitHub deployment..."
    
    # Check if already linked to a Vercel project
    if [ -d ".vercel" ]; then
        echo "Project is already linked to Vercel."
    else
        echo "Linking project to Vercel..."
        vercel link
    fi
    
    echo "Deploying from GitHub repository..."
    vercel --prod
    
    echo "✅ Deployment process completed!"
    echo "Your app is now being built and deployed from your GitHub repository."
    echo "You can check the deployment status on the Vercel dashboard."
    
else
    # Local deployment (original method)
    echo "WARNING: Local deployment may fail if your project exceeds 100MB."
    echo "Building client..."
    cd client
    npm run build
    cd ..
    
    echo "Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployment process completed!"
fi 