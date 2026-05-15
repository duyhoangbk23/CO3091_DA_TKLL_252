# $PROFILE (PowerShell Startup Script)
# This script provides convenient functions for IoT project management

function Start-IoTProject {
    <#
    .SYNOPSIS
        Start the complete IoT project (backend, ESP32 monitoring)
    
    .EXAMPLE
        Start-IoTProject
    #>
    & ".\scripts\run.bat"
}

function Start-Backend {
    <#
    .SYNOPSIS
        Start only the backend server
    
    .EXAMPLE
        Start-Backend
    #>
    & ".\scripts\start-backend.bat"
}

function Build-Firmware {
    <#
    .SYNOPSIS
        Build ESP32 firmware
    
    .EXAMPLE
        Build-Firmware
    #>
    & ".\scripts\build-firmware.bat"
}

function Monitor-ESP32 {
    <#
    .SYNOPSIS
        Monitor ESP32 serial output
    
    .EXAMPLE
        Monitor-ESP32
    #>
    platformio device monitor --environment esp32dev --baud 115200
}

function Install-Dependencies {
    <#
    .SYNOPSIS
        Install all project dependencies
    
    .EXAMPLE
        Install-Dependencies
    #>
    Write-Host "Installing backend dependencies..."
    Push-Location "iot_backend\backend"
    npm install
    Pop-Location
    
    Write-Host "`nChecking PlatformIO..."
    platformio --version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing PlatformIO..."
        pip install platformio
    }
    
    Write-Host "`nAll dependencies installed!"
}

function Get-ProjectStatus {
    <#
    .SYNOPSIS
        Check project status (port usage, services running)
    
    .EXAMPLE
        Get-ProjectStatus
    #>
    Write-Host "=== Project Status ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Check backend port
    Write-Host "Backend Port 3001:" -ForegroundColor Yellow
    $port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($port3001) {
        Write-Host "  ✓ Backend running on port 3001" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Backend not running" -ForegroundColor Red
    }
    
    # Check Node.js
    Write-Host "`nNode.js:" -ForegroundColor Yellow
    $node = node --version
    Write-Host "  ✓ $node" -ForegroundColor Green
    
    # Check npm
    Write-Host "`nnpm:" -ForegroundColor Yellow
    $npm = npm --version
    Write-Host "  ✓ $npm" -ForegroundColor Green
    
    # Check PlatformIO
    Write-Host "`nPlatformIO:" -ForegroundColor Yellow
    $pio = platformio --version 2>$null
    if ($pio) {
        Write-Host "  ✓ $pio" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PlatformIO not installed" -ForegroundColor Red
        Write-Host "    Install with: pip install platformio"
    }
    
    Write-Host ""
}

function Kill-Port {
    <#
    .SYNOPSIS
        Kill process using specific port
    
    .PARAMETER Port
        Port number to clear
    
    .EXAMPLE
        Kill-Port 3001
    #>
    param([int]$Port = 3001)
    
    Write-Host "Looking for process on port $Port..."
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Killing process..."
        Stop-Process -Id $process.OwningProcess -Force
        Write-Host "Process killed!" -ForegroundColor Green
    } else {
        Write-Host "No process found on port $Port" -ForegroundColor Yellow
    }
}

# Aliases for quick access
Set-Alias -Name iot-start -Value Start-IoTProject -Force
Set-Alias -Name iot-backend -Value Start-Backend -Force
Set-Alias -Name iot-build -Value Build-Firmware -Force
Set-Alias -Name iot-monitor -Value Monitor-ESP32 -Force
Set-Alias -Name iot-status -Value Get-ProjectStatus -Force
Set-Alias -Name iot-deps -Value Install-Dependencies -Force

Write-Host ""
Write-Host "IoT Project PowerShell Profile Loaded" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  iot-start      - Start full project"
Write-Host "  iot-backend    - Start backend only"
Write-Host "  iot-build      - Build firmware"
Write-Host "  iot-monitor    - Monitor ESP32 serial"
Write-Host "  iot-status     - Check project status"
Write-Host "  iot-deps       - Install dependencies"
Write-Host "  Kill-Port      - Kill process on port (Kill-Port 3001)"
Write-Host ""
