#!/bin/bash

# Exit on error
set -e

# First, check if the GitHub token is provided
if [ -z "$1" ]; then
  echo "Error: GitHub token not provided!"
  echo "Usage: ./publish-release.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

# Set the GitHub token
GITHUB_TOKEN=$1

# Navigate to electron directory
cd /home/peshang/pos-system/electron

# Publish to GitHub
echo "Publishing release to GitHub..."
GH_TOKEN=$GITHUB_TOKEN npm run publish:linux

echo "Release published successfully!" 