@echo off
chcp 65001 > nul
REM ================================================================
REM  IoT RTOS Project - Master Startup Script
REM  Chạy toàn bộ project: Hardware, Backend, Frontend, mở Website
REM ================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM ================================================================
REM COLORS AND FORMATTING
REM ================================================================
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo.
echo ================================================================
echo   IoT RTOS Project - Full Stack Startup
echo ================================================================
echo.

REM ================================================================
REM STEP 1: Kiểm tra Prerequisites
REM ================================================================
echo %YELLOW%[1/5] Checking prerequisites...%RESET%
echo.

REM Check Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR] Node.js not found! Please install Node.js from https://nodejs.org/%RESET%
    echo.
    pause
    exit /b 1
)
echo %GREEN%✓ Node.js found: %RESET%
node --version

REM Check npm
npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR] npm not found!%RESET%
    pause
    exit /b 1
)
echo %GREEN%✓ npm found: %RESET%
npm --version

REM Check PlatformIO
platformio --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %YELLOW%[WARN] PlatformIO not found in PATH%RESET%
    echo Trying to use PlatformIO from Python environment...
    python -m platformio --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo %YELLOW%[INFO] PlatformIO will be installed via pip if needed%RESET%
    )
)

echo.
echo %GREEN%✓ All prerequisites OK%RESET%
echo.

REM ================================================================
REM STEP 2: Setup Backend Dependencies
REM ================================================================
echo %YELLOW%[2/5] Setting up backend dependencies...%RESET%
echo.

if not exist "iot_backend\backend\node_modules" (
    echo Installing npm dependencies...
    cd iot_backend\backend
    call npm install
    if !errorlevel! neq 0 (
        echo %RED%[ERROR] Failed to install npm dependencies%RESET%
        cd /d "%~dp0"
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)
echo %GREEN%✓ Backend dependencies ready%RESET%
echo.

REM ================================================================
REM STEP 3: Build ESP32 Firmware (Optional)
REM ================================================================
echo %YELLOW%[3/5] Building ESP32 firmware...%RESET%
echo.
echo Note: Make sure ESP32 is NOT connected for building
echo (or building will fail with upload timeout)
echo.

REM Ask user if they want to build
set /p BUILD_CHOICE="Build firmware? (y/n, default=n): "
if /i "%BUILD_CHOICE%"=="y" (
    echo Building ESP32 firmware...
    
    REM Try with platformio CLI
    platformio run --environment esp32dev 2>nul
    if !errorlevel! neq 0 (
        REM Try with python module
        python -m platformio run --environment esp32dev
        if !errorlevel! neq 0 (
            echo %RED%[WARN] Build failed. Make sure platformio is installed: pip install platformio%RESET%
        ) else (
            echo %GREEN%✓ Firmware built successfully%RESET%
        )
    ) else (
        echo %GREEN%✓ Firmware built successfully%RESET%
    )
) else (
    echo Skipping firmware build
)
echo.

REM ================================================================
REM STEP 4: Start Backend Server
REM ================================================================
echo %YELLOW%[4/5] Starting backend server...%RESET%
echo.

cd iot_backend\backend

REM Check if .env exists
if not exist ".env" (
    echo Creating .env from .env.example...
    if exist ".env.example" (
        copy .env.example .env >nul 2>&1
    ) else (
        echo %YELLOW%[WARN] .env.example not found, using defaults%RESET%
    )
)

REM Start backend in new window
echo Starting Node.js server on port 3001...
start "IoT Backend Server" cmd /k "title IoT Backend Server && npm start"

REM Wait for server to start
echo Waiting for server to start (5 seconds)...
timeout /t 5 /nobreak

cd /d "%~dp0"
echo %GREEN%✓ Backend server started%RESET%
echo.

REM ================================================================
REM STEP 5: Open Frontend in Browser
REM ================================================================
echo %YELLOW%[5/5] Opening frontend...%RESET%
echo.

set "FRONTEND_URL=http://localhost:3001"
echo Opening %FRONTEND_URL%...

REM Try different browsers
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%FRONTEND_URL%"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%FRONTEND_URL%"
) else if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
    start "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" "%FRONTEND_URL%"
) else if exist "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe" (
    start "" "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe" "%FRONTEND_URL%"
) else (
    start "%FRONTEND_URL%"
)

echo %GREEN%✓ Frontend opened in browser%RESET%
echo.

REM ================================================================
REM STEP 6: ESP32 Connection Instructions
REM ================================================================
echo ================================================================
echo   All systems started!
echo ================================================================
echo.
echo %GREEN%✓ Backend Server:%RESET%   http://localhost:3001
echo %GREEN%✓ Dashboard:%RESET%         http://localhost:3001/public/index.html
echo %GREEN%✓ Analytics:%RESET%         http://localhost:3001/public/analytics.html
echo %GREEN%✓ Control Panel:%RESET%     http://localhost:3001/public/control.html
echo.

echo %YELLOW%[Next Steps]%RESET%
echo.
echo 1. Connect ESP32 to USB port
echo 2. Configure WiFi credentials in hardware/main/main.ino:
echo    - Update WIFI_SSID and WIFI_PASS
echo 3. Build and upload firmware:
echo    - Use: build-firmware.bat
echo    - Or: platformio run --target upload --environment esp32dev
echo 4. Check Serial Monitor (115200 baud) for connection status
echo.
echo 5. WiFi Test (Optional):
echo    - Use: hardware/test/testWiFi/testWiFi.ino
echo.

echo %YELLOW%[Helpful Commands]%RESET%
echo.
echo  - View backend logs: See "IoT Backend Server" window
echo  - Serial Monitor:    platformio device monitor --environment esp32dev --baud 115200
echo  - Stop backend:      Close "IoT Backend Server" window
echo  - Stop all:          Close all windows and this script
echo.

echo Press ENTER to continue...
pause

endlocal
