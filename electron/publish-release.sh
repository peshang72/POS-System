#!/bin/bash

# Exit on error
set -e

# Check if the GitHub token is provided as an environment variable
if [ -z "$GH_TOKEN" ]; then
  echo "Error: GitHub token not provided!"
  echo "Usage: GH_TOKEN=your_github_token ./publish-release.sh"
  exit 1
fi

# Navigate to electron directory
cd "$(dirname "$0")"

# Publish to GitHub
echo "Publishing release to GitHub..."
npx electron-builder --linux --publish always

echo "Release published successfully!" 