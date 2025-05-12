#!/bin/bash

# Vercel deployment script for POS System

echo "🚀 Starting Vercel deployment process..."

# Step 1: Install Vercel CLI if not already installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 2: Build the client
echo "Building client..."
cd client
npm run build
cd ..

# Step 3: Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment process completed!"
echo "If this is your first time deploying, you may need to follow the Vercel CLI login prompts."
echo "Your app should now be accessible via the URL provided by Vercel." 