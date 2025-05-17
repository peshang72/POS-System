#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== POS System Environment Setup ===${NC}"
echo -e "This script will help you set up your environment variables securely.\n"

# Create .env file if it doesn't exist
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  touch "$ENV_FILE"
  chmod 600 "$ENV_FILE" # Read/write permissions only for owner
else
  echo -e "${YELLOW}Updating existing .env file...${NC}"
  chmod 600 "$ENV_FILE" # Ensure proper permissions
fi

# Ask for GitHub token
echo -e "${YELLOW}Please enter your GitHub Personal Access Token:${NC}"
echo -e "(Token will not be displayed as you type for security)"
read -s GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "\n${YELLOW}No token provided. You can add it later by editing the .env file.${NC}"
else
  # Save token to .env file
  grep -v "GH_TOKEN=" "$ENV_FILE" > "$ENV_FILE.tmp" 2>/dev/null || touch "$ENV_FILE.tmp"
  echo "GH_TOKEN=$GITHUB_TOKEN" >> "$ENV_FILE.tmp"
  mv "$ENV_FILE.tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo -e "\n${GREEN}GitHub token saved to .env file!${NC}"
fi

# Create env-load.sh script
ENV_LOADER="env-load.sh"
echo -e "${YELLOW}Creating environment loader script...${NC}"

cat > "$ENV_LOADER" << 'EOF'
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
EOF

chmod +x "$ENV_LOADER"

echo -e "\n${GREEN}Environment setup complete!${NC}"
echo -e "${YELLOW}To load your environment variables before publishing, run:${NC}"
echo -e "  ${BLUE}source ./env-load.sh${NC}"
echo -e "${YELLOW}Then you can publish without typing your token:${NC}"
echo -e "  ${BLUE}./publish-windows.sh${NC}"
echo -e "\n${YELLOW}Note: Your GitHub token is stored in the .env file.${NC}"
echo -e "${YELLOW}Keep this file secure and do not commit it to version control!${NC}"

# Add .env to .gitignore if it exists
if [ -f ../.gitignore ]; then
  if ! grep -q "^.env$" ../.gitignore; then
    echo -e "\n${YELLOW}Adding .env to .gitignore...${NC}"
    echo ".env" >> ../.gitignore
    echo -e "${GREEN}Added .env to .gitignore to prevent accidental commits.${NC}"
  fi
fi

# Add .env to .gitignore in current directory if it exists
if [ -f .gitignore ]; then
  if ! grep -q "^.env$" .gitignore; then
    echo ".env" >> .gitignore
  fi
else
  echo ".env" > .gitignore
  echo -e "${GREEN}Created .gitignore file to prevent accidental commits of sensitive data.${NC}"
fi 