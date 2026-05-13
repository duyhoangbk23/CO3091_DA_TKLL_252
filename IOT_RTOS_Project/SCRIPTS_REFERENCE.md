# 📦 Project Startup Scripts - Complete Reference

## Overview

This document describes all the startup scripts and tools available for running the IoT RTOS Project.

---

## 🎯 Quick Start

Choose your platform:

### Windows (Batch - Recommended)
```bash
run.bat
```

### Windows (PowerShell Modern)
```powershell
.\run.ps1
```

### macOS / Linux
```bash
./run.sh
```

### Any Platform (Node.js)
```bash
node startup-manager.js
```

---

## 📁 Startup Scripts Reference

### 1. **run.bat** (Windows Batch)

**Best for:** Traditional Windows users, older Windows versions

**What it does:**
- ✓ Checks Node.js, npm, PlatformIO installation
- ✓ Installs npm dependencies
- ✓ Optionally builds ESP32 firmware
- ✓ Starts Node.js backend
- ✓ Opens dashboard in default browser
- ✓ Displays connection instructions

**Usage:**
```batch
run.bat
```

**Features:**
- Color-coded output (Green=success, Yellow=warning, Red=error)
- Interactive prompts for firmware build
- Auto-detects installed browsers (Chrome, Firefox)
- Handles network timeouts gracefully

**Troubleshooting:**
- If doesn't open in colors: System doesn't support ANSI colors
- If browser doesn't open: Manually navigate to http://localhost:3001

---

### 2. **run.ps1** (PowerShell)

**Best for:** Windows 10/11 with PowerShell 5.1+

**What it does:** Same as run.bat but with PowerShell features

**Usage:**
```powershell
.\run.ps1                    # Full startup
.\run.ps1 -BackendOnly       # Backend only
.\run.ps1 -NoBuild           # Skip build
.\run.ps1 -Quiet             # Minimal output
.\run.ps1 -Help              # Show help
```

**Features:**
- Better error handling
- Job management for parallel processes
- Automatic cleanup on exit
- Parameter-based control

**Requirements:**
- PowerShell 5.1+ (built-in on Windows 10+)
- May need to run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

### 3. **run.sh** (Bash/Shell)

**Best for:** macOS and Linux

**What it does:** Same functionality adapted for Unix-like systems

**Usage:**
```bash
chmod +x run.sh              # Make executable (first time only)
./run.sh                     # Run startup
```

**Features:**
- POSIX shell compatible
- Auto-detects browser (macOS/Linux)
- Proper process management with background jobs
- Handles Ctrl+C cleanup

---

### 4. **startup-manager.js** (Node.js)

**Best for:** Cross-platform (Windows, macOS, Linux)

**What it does:**
- Pure Node.js orchestrator
- No external dependencies beyond Node.js
- Starts backend and opens browser
- Proper error handling and logging

**Usage:**
```bash
node startup-manager.js                   # Full startup
node startup-manager.js --backend-only    # Backend only
node startup-manager.js --port 3000       # Custom port
node startup-manager.js --quiet           # Minimal logging
node startup-manager.js --help            # Show help
```

**Features:**
- Colored output with timestamps
- Automatic dependency installation
- Browser auto-detection
- SIGINT (Ctrl+C) handling

**Example:**
```bash
# Start backend on port 3000 without opening browser
node startup-manager.js --backend-only --port 3000
```

---

## 🔧 Utility Scripts

### 5. **start-backend.bat** (Windows)

Start backend server only, without firmware build or browser.

```batch
start-backend.bat
```

**Use when:**
- You only want to develop backend
- Frontend is already running
- Testing API changes

---

### 6. **build-firmware.bat** (Windows)

Interactive firmware builder with options:

```batch
build-firmware.bat

Options:
  1. Build firmware only (no upload)
  2. Build and upload to ESP32
  3. Clean build
  4. Monitor serial output
```

**Use when:**
- Updating ESP32 code
- Need fresh build
- Monitoring device output

---

## 🎛️ PowerShell Profile (profile.ps1)

Convenient commands for project management in PowerShell.

**Installation:**
```powershell
# Add to your PowerShell profile
Add-Content $PROFILE ". '$(pwd)\profile.ps1'"
```

**Available Commands:**
```powershell
iot-start      # Start full project
iot-backend    # Start backend only
iot-build      # Build firmware
iot-monitor    # Monitor ESP32
iot-status     # Check status
iot-deps       # Install dependencies
Kill-Port 3001 # Kill process on port
```

**Example:**
```powershell
iot-start      # Equivalent to run.bat
iot-status     # Check what's running
iot-monitor    # See ESP32 serial output
```

---

## 📋 npm Scripts (package.json)

From root directory:

```bash
npm start                   # Start full project
npm run start:backend-only  # Backend only
npm run backend             # Alias for backend-only
npm run backend:dev         # Backend development mode
npm run build:firmware      # Build ESP32
npm run upload              # Upload to device
npm run monitor             # Monitor serial
npm run clean               # Clean build
npm run rebuild             # Full rebuild
npm run test                # Run tests
npm run setup               # Install dependencies
npm run help                # Show startup guide
```

**Examples:**
```bash
npm start                   # Full startup
npm run upload              # Build and upload firmware
npm run monitor             # Serial monitor
npm run backend             # Backend only
```

---

## 🔄 Workflow Comparison

### Option 1: Batch (Windows Beginner)
```
1. Double-click run.bat
2. Choose build option
3. Wait for backend to start
4. Dashboard opens automatically
```

### Option 2: PowerShell (Windows Advanced)
```
1. .\run.ps1
2. More control with parameters
3. Better error handling
4. Dashboard opens automatically
```

### Option 3: npm Scripts (Any Platform)
```
1. npm install (first time)
2. npm start
3. Wait for backend
4. Manually open browser
```

### Option 4: Manual (Full Control)
```
1. cd iot_backend/backend
2. npm install
3. npm start
4. Open http://localhost:3001 in browser
```

---

## 🌐 Accessing the Project

After startup, available at:

| Page | URL | Purpose |
|------|-----|---------|
| Main Dashboard | http://localhost:3001/public/index.html | Real-time sensor data |
| Analytics | http://localhost:3001/public/analytics.html | Historical data analysis |
| Control Panel | http://localhost:3001/public/control.html | Device control |
| API Base | http://localhost:3001/api | REST API |
| API Docs | http://localhost:3001/api/docs | API documentation (if available) |

---

## 🔌 ESP32 Connection Steps

1. **Configure WiFi:**
   ```cpp
   // Edit: hardware/main/main.ino or hardware/main/Pins.h
   #define WIFI_SSID "Your_WiFi"
   #define WIFI_PASS "Your_Password"
   ```

2. **Build Firmware:**
   ```bash
   # Using run.bat: Select option 2
   # Or manual:
   platformio run --target upload --environment esp32dev
   ```

3. **Monitor Connection:**
   ```bash
   platformio device monitor --baud 115200
   ```

4. **Verify in Dashboard:**
   - Check http://localhost:3001
   - Look for ESP32 device data

---

## 🚨 Common Issues & Solutions

### Issue: Port 3001 already in use

**Windows:**
```batch
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use npm
npm install -g kill-port
kill-port 3001
```

**macOS/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue: "Node.js not found"
```bash
# Download from https://nodejs.org/
# Or install via package manager
# macOS: brew install node
# Linux (Debian): sudo apt install nodejs npm
```

### Issue: "PlatformIO not found"
```bash
pip install platformio
# Then add to PATH or use python -m platformio
```

### Issue: ESP32 not recognized
```bash
# Install USB driver (CH340)
# Windows: Download from Silicon Labs
# macOS: brew install ch340g-serial-driver
# Linux: Usually built-in
```

---

## 📊 Process Management

### View Running Processes

**Windows:**
```powershell
Get-Process node
Get-NetTCPConnection -LocalPort 3001
```

**macOS/Linux:**
```bash
ps aux | grep node
lsof -i :3001
```

### Stop Services

**Windows:**
```batch
taskkill /IM node.exe /F
```

**macOS/Linux:**
```bash
pkill -f "node|npm"
```

---

## 🔒 Environment Configuration

Create `.env` file in `iot_backend/backend/`:

```env
# Minimal setup
NODE_ENV=development
PORT=3001
MQTT_SERVER=localhost
MQTT_PORT=1883

# Extended setup (see .env.example)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=your-secret-key
```

---

## 🎓 Development Workflow

### Daily Development
```bash
# Terminal 1: Start backend
npm run backend

# Terminal 2: Monitor ESP32
npm run monitor

# Terminal 3: Rebuild firmware (when needed)
npm run rebuild && npm run upload
```

### Testing
```bash
npm test                    # Run all tests
npm run backend:test        # Backend tests only
npm run backend:watch       # Watch mode
```

### Debugging
```bash
# ESP32 Serial Monitor
npm run monitor

# Backend Logs
tail -f iot_backend/backend/logs/app.log

# Browser DevTools
F12 in browser (Frontend debugging)
```

---

## 📚 Additional Resources

- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - Full startup guide
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development setup
- [hardware/README.md](./hardware/README.md) - Hardware documentation
- [iot_backend/backend/README.md](./iot_backend/backend/README.md) - Backend API

---

## ✅ Troubleshooting Checklist

- [ ] Node.js installed? `node --version`
- [ ] npm installed? `npm --version`
- [ ] PlatformIO available? `platformio --version`
- [ ] Port 3001 free? `netstat -ano | findstr :3001`
- [ ] ESP32 connected? `platformio device list`
- [ ] WiFi configured? Check hardware/main/main.ino
- [ ] .env file exists? Check iot_backend/backend/.env
- [ ] Database running? (if using MySQL)
- [ ] Firewall allowing port 3001?
- [ ] Terminal/Console admin rights? (if needed)

---

## 💡 Pro Tips

1. **Use npm start** for consistent experience across platforms
2. **Set ENABLE_MOCK_DATA=true** in .env to test without ESP32
3. **Run build and upload separately** for debugging firmware issues
4. **Keep browser DevTools open** (F12) to see frontend errors
5. **Monitor backend logs** while testing device connection
6. **Use PowerShell profile** for quick repeated commands

---

**Happy coding! 🎉**

For issues or questions, check the troubleshooting section or documentation files.
