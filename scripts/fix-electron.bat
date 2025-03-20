@echo off
echo Fixing Electron installation...

echo Removing node_modules directory...
if exist node_modules (
    rmdir /s /q node_modules
)

echo Clearing pnpm store cache for electron...
pnpm store prune

echo Reinstalling dependencies...
pnpm install --force

echo Done! Try running the application now with: pnpm start 