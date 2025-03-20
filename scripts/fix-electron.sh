#!/bin/bash

echo "Fixing Electron installation..."

echo "Removing node_modules directory..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
fi

echo "Clearing pnpm store cache for electron..."
pnpm store prune

echo "Reinstalling dependencies..."
pnpm install --force

echo "Done! Try running the application now with: pnpm start" 