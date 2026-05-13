# ================================================================
#  IoT RTOS Project - Master Startup Script (PowerShell)
#  
#  Better for modern Windows (PowerShell 7+)
#  Usage: .\run.ps1
# ================================================================

param(
    [switch]$BackendOnly,
    [switch]$NoBuild,
    [switch]$Quiet,
    [switch]$Help
)

if ($Help) {
    @"
IoT RTOS Project - Startup Manager (PowerShell)

Usage: .\run.ps1 [options]

Options:
    -BackendOnly    Start only backend (no browser)
    -NoBuild        Skip firmware build prompt
    -Quiet          Suppress log output
    -Help           Show this help

Examples:
    .\run.ps1                      # Full startup
    .\run.ps1 -BackendOnly         # Backend only
    .\run.ps1 -NoBuild             # Skip build
    .\run.ps1 -BackendOnly -NoBuild -Quiet
"@
    exit 0
}

# ================================================================
# Configuration
# ================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$config = @{
    BackendPort = $env:PORT ?? 3001
    BackendDir  = Join-Path $PSScriptRoot "iot_backend\backend"
    ProjectRoot = $PSScriptRoot
    FrontendUrl = "http://localhost:$(if ($env:PORT) { $env:PORT } else { 3001 })"
}

# ================================================================
# Color Functions
# ================================================================

function Write-Success ($msg) {
    if (-not $Quiet) {
        Write-Host "✓ " -ForegroundColor Green -NoNewline
        Write-Host $msg
    }
}

function Write-Info ($msg) {
    if (-not $Quiet) {
        Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
        Write-Host $msg
    }
}

function Write-Warn ($msg) {
    if (-not $Quiet) {
        Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
        Write-Host $msg
    }
}

function Write-Error ($msg) {
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $msg
}

function Write-Header ($msg) {
    if (-not $Quiet) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Cyan
        Write-Host "   $msg" -ForegroundColor Cyan
        Write-Host "================================================================" -ForegroundColor Cyan
        Write-Host ""
    }
}

# ================================================================
# Helper Functions
# ================================================================

function Test-Command ($cmd) {
    try {
        & $cmd --version > $null 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Start-Sleep-Seconds ($seconds) {
    Start-Sleep -Seconds $seconds
}

# ================================================================
# Main Flow
# ================================================================

Write-Header "IoT RTOS Project - Full Stack Startup"

# Step 1: Check prerequisites
Write-Info "[1/5] Checking prerequisites..."

if (-not (Test-Command "node")) {
    Write-Error "Node.js not found! Install from https://nodejs.org/"
    exit 1
}
Write-Success "Node.js: $(node --version)"

if (-not (Test-Command "npm")) {
    Write-Error "npm not found!"
    exit 1
}
Write-Success "npm: $(npm --version)"

if (Test-Command "platformio") {
    Write-Success "PlatformIO: $(platformio --version)"
} else {
    Write-Warn "PlatformIO not found. Install with: pip install platformio"
}

Write-Success "All prerequisites OK"
Write-Host ""

# Step 2: Setup backend dependencies
Write-Info "[2/5] Setting up backend dependencies..."

$nodeModules = Join-Path $config.BackendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Info "Installing npm dependencies..."
    Push-Location $config.BackendDir
    npm install | Out-Null
    Pop-Location
}
Write-Success "Backend dependencies ready"
Write-Host ""

# Step 3: Build firmware (optional)
if (-not $NoBuild) {
    Write-Info "[3/5] Building ESP32 firmware..."
    Write-Host "Note: Disconnect ESP32 from USB before building" -ForegroundColor Yellow
    Write-Host ""
    
    $buildChoice = Read-Host "Build firmware? (y/n, default=n)"
    
    if ($buildChoice -eq "y") {
        Write-Info "Building ESP32 firmware..."
        
        if (Test-Command "platformio") {
            platformio run --environment esp32dev
        } else {
            python -m platformio run --environment esp32dev
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Firmware built successfully"
        } else {
            Write-Warn "Build failed. Make sure PlatformIO is installed"
        }
    } else {
        Write-Info "Skipping firmware build"
    }
    Write-Host ""
}

# Step 4: Start backend server
Write-Info "[4/5] Starting backend server..."

$envFile = Join-Path $config.BackendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Info "Creating .env file..."
    $envExample = Join-Path $config.BackendDir ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
    }
}

Write-Info "Starting Node.js server on port $($config.BackendPort)..."

$job = Start-Job -ScriptBlock {
    Set-Location $using:config.BackendDir
    npm start
}

Start-Sleep-Seconds 5

Write-Success "Backend server started"
Write-Host ""

# Step 5: Open frontend
if (-not $BackendOnly) {
    Write-Info "[5/5] Opening frontend..."
    Start-Process $config.FrontendUrl
    Write-Success "Frontend opened in browser"
    Write-Host ""
}

# Summary
Write-Header "All systems started!"

Write-Host "Backend Server:   " -NoNewline
Write-Host "$($config.FrontendUrl)" -ForegroundColor Green

Write-Host "Dashboard:        " -NoNewline
Write-Host "$($config.FrontendUrl)/public/index.html" -ForegroundColor Green

Write-Host "Analytics:        " -NoNewline
Write-Host "$($config.FrontendUrl)/public/analytics.html" -ForegroundColor Green

Write-Host "Control Panel:    " -NoNewline
Write-Host "$($config.FrontendUrl)/public/control.html" -ForegroundColor Green

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Connect ESP32 to USB"
Write-Host "  2. Configure WiFi in hardware/main/main.ino"
Write-Host "  3. Build and upload: npm run upload"
Write-Host "  4. Monitor: npm run monitor"
Write-Host ""

# Wait for backend
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

try {
    Receive-Job -Job $job -Wait
} catch {
    # Handle Ctrl+C
}

# Cleanup
Stop-Job -Job $job -ErrorAction SilentlyContinue
Remove-Job -Job $job -ErrorAction SilentlyContinue
