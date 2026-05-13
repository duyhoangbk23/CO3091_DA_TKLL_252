#!/bin/bash
# ================================================================
#  IoT RTOS Project - Master Startup Script (Linux/macOS)
# ================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'  # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "================================================================"
echo "   IoT RTOS Project - Full Stack Startup"
echo "================================================================"
echo ""

# ================================================================
# STEP 1: Check prerequisites
# ================================================================
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js not found!${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js:${NC}"
node --version

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm:${NC}"
npm --version

# Check PlatformIO
if ! command -v platformio &> /dev/null; then
    echo -e "${YELLOW}[INFO] PlatformIO not in PATH${NC}"
    echo "Install with: pip3 install platformio"
fi

echo ""
echo -e "${GREEN}✓ All prerequisites OK${NC}"
echo ""

# ================================================================
# STEP 2: Setup backend dependencies
# ================================================================
echo -e "${YELLOW}[2/5] Setting up backend dependencies...${NC}"
echo ""

if [ ! -d "iot_backend/backend/node_modules" ]; then
    echo "Installing npm dependencies..."
    cd iot_backend/backend
    npm install
    cd "$PROJECT_ROOT"
fi
echo -e "${GREEN}✓ Backend dependencies ready${NC}"
echo ""

# ================================================================
# STEP 3: Build ESP32 Firmware (Optional)
# ================================================================
echo -e "${YELLOW}[3/5] Building ESP32 firmware...${NC}"
echo ""
echo "Note: Make sure ESP32 is NOT connected for building"
echo ""
read -p "Build firmware? (y/n, default=n): " BUILD_CHOICE

if [[ "$BUILD_CHOICE" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Building ESP32 firmware..."
    
    if command -v platformio &> /dev/null; then
        platformio run --environment esp32dev
    else
        python3 -m platformio run --environment esp32dev
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Firmware built successfully${NC}"
    else
        echo -e "${RED}[WARN] Build failed${NC}"
        echo "Make sure PlatformIO is installed: pip3 install platformio"
    fi
else
    echo "Skipping firmware build"
fi
echo ""

# ================================================================
# STEP 4: Start backend server
# ================================================================
echo -e "${YELLOW}[4/5] Starting backend server...${NC}"
echo ""

cd iot_backend/backend

# Create .env if needed
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

echo "Starting Node.js server on port 3001..."
npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 5

cd "$PROJECT_ROOT"
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
echo ""

# ================================================================
# STEP 5: Open frontend in browser
# ================================================================
echo -e "${YELLOW}[5/5] Opening frontend...${NC}"
echo ""

FRONTEND_URL="http://localhost:3001"

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$FRONTEND_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "$FRONTEND_URL" &
    elif command -v firefox &> /dev/null; then
        firefox "$FRONTEND_URL" &
    elif command -v chromium &> /dev/null; then
        chromium "$FRONTEND_URL" &
    fi
fi

echo -e "${GREEN}✓ Frontend opened in browser${NC}"
echo ""

# ================================================================
# Summary
# ================================================================
echo "================================================================"
echo "   All systems started!"
echo "================================================================"
echo ""
echo -e "${GREEN}✓ Backend Server:${NC}   $FRONTEND_URL"
echo -e "${GREEN}✓ Dashboard:${NC}        $FRONTEND_URL/public/index.html"
echo -e "${GREEN}✓ Analytics:${NC}        $FRONTEND_URL/public/analytics.html"
echo -e "${GREEN}✓ Control Panel:${NC}    $FRONTEND_URL/public/control.html"
echo ""

echo -e "${YELLOW}[Next Steps]${NC}"
echo ""
echo "1. Connect ESP32 to USB port"
echo "2. Configure WiFi in hardware/main/main.ino"
echo "3. Build and upload: ./build-firmware.sh"
echo "4. Check Serial Monitor: platformio device monitor"
echo ""

echo -e "${YELLOW}[Helpful Commands]${NC}"
echo ""
echo "  - Serial Monitor:    platformio device monitor --baud 115200"
echo "  - Stop backend:      kill $BACKEND_PID"
echo "  - View logs:         tail -f iot_backend/backend/logs/app.log"
echo ""

echo "Press Ctrl+C to stop all services"
echo ""

# Wait for backend process
wait $BACKEND_PID
