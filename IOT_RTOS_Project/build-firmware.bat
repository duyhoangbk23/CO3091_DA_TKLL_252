@echo off
chcp 65001 > nul
REM ================================================================
REM  Build ESP32 Firmware Script
REM ================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ================================================================
echo   ESP32 Firmware Build
echo ================================================================
echo.

REM Check PlatformIO
platformio --version >nul 2>&1
if !errorlevel! neq 0 (
    echo Trying to use PlatformIO from Python environment...
    python -m platformio --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] PlatformIO not found. Install with: pip install platformio
        pause
        exit /b 1
    )
    set "PIO=python -m platformio"
) else (
    set "PIO=platformio"
)

echo.
echo ⚠️  Important: Disconnect ESP32 from USB before building!
echo.
echo 1. Build firmware only (no upload)
echo 2. Build and upload to ESP32
echo 3. Clean build
echo 4. Monitor serial output
echo.

set /p CHOICE="Choose option (1-4): "

if "%CHOICE%"=="1" (
    echo.
    echo Building firmware...
    !PIO! run --environment esp32dev
) else if "%CHOICE%"=="2" (
    echo.
    echo Connecting ESP32 and building...
    timeout /t 3 /nobreak
    echo Building and uploading...
    !PIO! run --target upload --environment esp32dev
) else if "%CHOICE%"=="3" (
    echo.
    echo Cleaning previous build...
    !PIO! run --target clean --environment esp32dev
    echo Building fresh...
    !PIO! run --environment esp32dev
) else if "%CHOICE%"=="4" (
    echo.
    echo Starting serial monitor (press Ctrl+C to exit)...
    !PIO! device monitor --environment esp32dev --baud 115200
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo Done!
pause

endlocal
