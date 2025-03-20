@echo off
echo Installing dependencies...
call pnpm install

echo Building the application...
call pnpm run webpack

echo Done! You can now run the app with 'pnpm start' or 'pnpm dev'
echo Remember to create a .env file with your GITHUB_TOKEN before running the app 