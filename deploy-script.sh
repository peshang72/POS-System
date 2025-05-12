#!/bin/bash

# Log in to Vercel
echo "Logging in to Vercel..."
npx vercel login

# Link project if not already linked
echo "Linking project..."
npx vercel link

# Set required environment variables for MongoDB
echo "Setting environment variables..."
npx vercel env add MONGO_URI
npx vercel env add JWT_SECRET

# Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod

echo "Deployment completed!" 