@echo off
chcp 65001 > nul
REM ================================================================
REM  Start Backend Server Only
REM ================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0\.."

echo.
echo ================================================================
echo   IoT Backend Server
echo ================================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org/
    pause
    exit /b 1
)

cd iot_backend\backend

REM Check node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create .env if not exists
if not exist ".env" (
    echo Creating .env file...
    if exist ".env.example" (
        copy .env.example .env >nul
    ) else (
        echo [WARN] .env.example not found
    )
)

echo.
echo Starting Node.js backend...
echo Port: 3000
echo Frontend: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

endlocal
