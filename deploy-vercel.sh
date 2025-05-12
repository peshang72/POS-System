#!/bin/bash

echo "Preparing for Vercel Deployment..."

# Make sure we have the latest dependencies
echo "Installing dependencies..."
npm install

# Update package.json for client
echo "Updating client package.json..."
cd client
if ! grep -q "\"@vitejs/plugin-react\"" package.json; then
  npm install --save-dev @vitejs/plugin-react vite
fi
cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "MONGO_URI=your_mongodb_atlas_connection_string" > .env
  echo "JWT_SECRET=your_jwt_secret" >> .env
  echo "JWT_EXPIRE=1d" >> .env
  echo "JWT_COOKIE_EXPIRE=1" >> .env
  echo "NODE_ENV=production" >> .env
  echo "Please update the .env file with your actual MongoDB connection string and JWT secret."
fi

# Prepare for deployment
echo "Starting deployment..."
echo "Options:"
echo "1. Deploy from GitHub (recommended)"
echo "2. Deploy from local files"
read -p "Select option (1/2): " option

if [ "$option" == "1" ]; then
  echo "Please use Vercel dashboard to import from GitHub:"
  echo "1. Go to https://vercel.com/new"
  echo "2. Import your GitHub repository"
  echo "3. Configure with:"
  echo "   - Build Command: npm run build:vercel"
  echo "   - Output Directory: client/dist"
  echo "4. Add environment variables from your .env file"
elif [ "$option" == "2" ]; then
  # Check if Vercel CLI is installed
  if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
  fi
  
  echo "Deploying with Vercel CLI..."
  vercel --prod
else
  echo "Invalid option selected"
  exit 1
fi

echo "Deployment process completed!" 