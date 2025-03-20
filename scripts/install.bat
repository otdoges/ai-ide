@echo off
echo Installing Codium AI IDE...

:: Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)

:: Install dependencies
echo Installing dependencies...
pnpm install

:: Build the application
echo Building application...
pnpm run build

echo.
echo Installation complete!
echo Run 'pnpm start' to launch the application
echo. 