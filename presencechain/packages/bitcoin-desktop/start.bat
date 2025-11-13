@echo off
REM Bitcoin Desktop Application Launcher (Windows)
REM For Joseph Michael Rounsaville

setlocal enabledelayedexpansion

echo ========================================
echo   Bitcoin Full Node Desktop Application
echo   For Joseph Michael Rounsaville
echo ========================================
echo.

REM Check Bitcoin Core
echo Checking Bitcoin Core installation...
where bitcoind >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Bitcoin Core not found!
    echo Please install Bitcoin Core from: https://bitcoin.org/en/download
    pause
    exit /b 1
) else (
    echo [OK] Bitcoin Core found
    bitcoind --version | findstr /R "Bitcoin Core version"
)

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js found
    node --version
)

REM Install dependencies
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.
echo Select an option:
echo 1. Run in Development Mode
echo 2. Build Application
echo 3. Run Built Application
echo 4. Package for Windows
echo 5. Check System Requirements
echo 6. Exit
echo.

set /p choice="Enter choice [1-6]: "

if "%choice%"=="1" (
    echo Starting development mode...
    call npm run dev
) else if "%choice%"=="2" (
    echo Building application...
    call npm run build
    echo [OK] Build complete
    pause
) else if "%choice%"=="3" (
    echo Starting application...
    call npm start
) else if "%choice%"=="4" (
    echo Packaging for Windows...
    call npm run package:win
    echo [OK] Package created in release/ folder
    pause
) else if "%choice%"=="5" (
    echo.
    echo System Requirements:
    echo   Storage: 500GB minimum, 1TB+ recommended
    echo   RAM: 4GB minimum, 8GB+ recommended
    echo   Network: Broadband internet for initial sync
    echo.
    pause
) else if "%choice%"=="6" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice
    pause
    goto :eof
)

endlocal
