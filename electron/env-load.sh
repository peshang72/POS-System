#!/bin/bash

# Source this file to load environment variables
# Usage: source ./env-load.sh

if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded successfully!"
else
  echo "Error: .env file not found!"
  echo "Run ./setup-env.sh first to create your environment configuration."
  return 1
fi
