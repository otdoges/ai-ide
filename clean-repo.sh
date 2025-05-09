#!/bin/bash

echo "Cleaning repository of large build artifacts..."

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf release/
rm -rf dist/
rm -rf dist-electron/

# Reset git to remove large files from history
echo "Cleaning Git history of large files..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch release/0.0.0/YourAppName-Linux-0.0.0.AppImage release/0.0.0/linux-unpacked/resources/app.asar release/0.0.0/linux-unpacked/ai-ide-electron" \
  --prune-empty --tag-name-filter cat -- --all

# Force garbage collection
echo "Running Git garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Cleaning complete. The repository should now be ready for pushing to GitHub."
echo "Remember to use Git LFS for large files in the future." 