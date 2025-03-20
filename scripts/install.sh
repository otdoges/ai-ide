#!/bin/bash

echo "Installing Codium AI IDE..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the application
echo "Building application..."
pnpm run build

echo ""
echo "Installation complete!"
echo "Run 'pnpm start' to launch the application"
echo "" 