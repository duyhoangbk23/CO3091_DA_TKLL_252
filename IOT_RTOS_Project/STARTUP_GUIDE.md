# 🚀 IoT RTOS Project - Complete Startup Guide

## Quick Start (2 minutes)

### Windows
```bash
# Double-click: run.bat
# Or from terminal:
run.bat
```

### macOS / Linux
```bash
chmod +x run.sh
./run.sh
```

### Node.js Cross-platform
```bash
node startup-manager.js
```

---

## 📁 Startup Scripts

### run.bat (Windows)
Complete startup script that:
- ✓ Checks Node.js, npm, PlatformIO
- ✓ Installs backend dependencies
- ✓ Optionally builds ESP32 firmware
- ✓ Starts Node.js backend server
- ✓ Opens dashboard in browser
- ✓ Provides ESP32 connection instructions

**Usage:**
```bash
run.bat                    # Full startup with all steps
```

### run.sh (macOS / Linux)
Same functionality as run.bat, adapted for Unix-like systems.

**Usage:**
```bash
./run.sh                   # Full startup
```

### startup-manager.js (Cross-platform)
Node.js-based orchestrator that starts backend and opens browser.

**Usage:**
```bash
node startup-manager.js                    # Full startup
node startup-manager.js --backend-only     # Backend only (no browser)
node startup-manager.js --port 3000        # Custom port
node startup-manager.js --help             # Show help
```

---

## 🔧 Individual Scripts

### start-backend.bat
Start backend server only (Windows).

```bash
start-backend.bat
```

### build-firmware.bat
Build/upload ESP32 firmware (Windows).

```bash
build-firmware.bat

# Options:
# 1. Build firmware only (no upload)
# 2. Build and upload to ESP32
# 3. Clean build
# 4. Monitor serial output
```

---

## 🌐 Project Structure

```
IOT_RTOS_Project/
├── run.bat                    # Windows startup
├── run.sh                     # Linux/macOS startup
├── startup-manager.js         # Node.js orchestrator
├── start-backend.bat          # Backend only (Windows)
├── build-firmware.bat         # Firmware build (Windows)
│
├── hardware/                  # ESP32 Arduino code
│   ├── main/main.ino          # Main firmware
│   └── test/testWiFi/         # WiFi test
│
├── rtos/                      # RTOS tasks
│   ├── include/config.h       # Configuration
│   └── src/main.cpp           # RTOS main
│
└── iot_backend/
    ├── backend/               # Node.js API server
    │   ├── src/
    │   ├── package.json
    │   └── .env.example
    └── frontend/              # Dashboard UI
        └── public/
            ├── index.html     # Main dashboard
            ├── analytics.html # Analytics page
            └── control.html   # Control panel
```

---

## 📋 System Requirements

### Windows
- Node.js v14+ (download: https://nodejs.org/)
- PlatformIO (install: `pip install platformio`)
- USB serial driver for ESP32

### macOS / Linux
- Node.js v14+
- PlatformIO
- USB drivers (usually built-in)

### Check Installation
```bash
node --version        # Should be v14 or higher
npm --version         # Should be v6 or higher
platformio --version  # Should be present
```

---

## 🎯 Workflow

### 1️⃣ First Time Setup

```bash
# Windows
run.bat

# macOS/Linux
./run.sh

# Or Node.js
node startup-manager.js
```

### 2️⃣ Configure ESP32 WiFi

Edit `hardware/main/main.ino` or `hardware/main/Pins.h`:

```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASS "Your_WiFi_Password"
```

### 3️⃣ Build and Upload Firmware

Option A - Windows:
```bash
build-firmware.bat
# Select: 2. Build and upload to ESP32
```

Option B - All platforms:
```bash
cd IOT_RTOS_Project
platformio run --target upload --environment esp32dev
```

### 4️⃣ Monitor ESP32

Open Serial Monitor:
```bash
platformio device monitor --environment esp32dev --baud 115200
```

### 5️⃣ Access Dashboard

- **Main Dashboard**: http://localhost:3001/public/index.html
- **Analytics**: http://localhost:3001/public/analytics.html
- **Control Panel**: http://localhost:3001/public/control.html
- **API Base**: http://localhost:3001/api

---

## 📊 Backend API Endpoints

```
GET    /api/sensors              # Get sensor data
GET    /api/sensors/:id          # Get specific sensor
POST   /api/control              # Send command
GET    /api/control/:id          # Get control status
GET    /api/health               # Health check
POST   /api/auth/login           # Authentication
```

---

## 🔌 ESP32 Connection

### Test WiFi Connection
```bash
# Windows
cd hardware/test/testWiFi
platformio run --target upload --environment esp32dev

# Monitor
platformio device monitor --baud 115200
```

### Common Issues

**WiFi won't connect:**
- Check SSID and password in code
- ESP32 needs 2.4GHz WiFi (not 5GHz)
- Verify router is nearby

**MQTT connection failed:**
- Backend server must be running
- Check MQTT broker settings in .env
- Verify firewall allows port 1883

**Serial port not found:**
- Connect ESP32 with USB cable
- Install CH340 driver if needed
- Check Device Manager for COM port

---

## 🛠 Environment Configuration

Create `iot_backend/backend/.env`:

```env
NODE_ENV=development
PORT=3001
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=iot_database

MQTT_SERVER=localhost
MQTT_PORT=1883

WIFI_SSID=Your_WiFi
WIFI_PASS=Your_Password

ENABLE_MOCK_DATA=true
```

---

## 📝 Useful Commands

### Backend

```bash
# Terminal 1: Start backend
cd iot_backend/backend
npm start

# Terminal 2: View logs
tail -f logs/app.log

# Run tests
npm test

# Linting
npm run lint
```

### ESP32

```bash
# Build firmware
platformio run --environment esp32dev

# Upload to device
platformio run --target upload --environment esp32dev

# Serial monitor
platformio device monitor --baud 115200

# Clean build
platformio run --target clean --environment esp32dev

# Full rebuild
platformio run --target clean --environment esp32dev && \
platformio run --environment esp32dev && \
platformio run --target upload --environment esp32dev
```

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check Node.js
node --version

# Check npm packages
cd iot_backend/backend
npm install

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Firmware build fails
```bash
# Update PlatformIO
pip install --upgrade platformio

# Clean build
platformio run --target clean --environment esp32dev
platformio run --environment esp32dev
```

### Port already in use
```bash
# Windows - Find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database connection error
- Start MySQL server
- Update DB credentials in .env
- Run database migrations if needed

---

## 📚 Documentation

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Detailed setup
- [hardware/README.md](./hardware/README.md) - Hardware setup
- [iot_backend/backend/README.md](./iot_backend/backend/README.md) - Backend API
- [iot_backend/frontend/README.md](./iot_backend/frontend/README.md) - Frontend

---

## 🎓 Next Steps

1. ✓ Run the startup script
2. ✓ Verify backend is running
3. ✓ Connect ESP32 to USB
4. ✓ Configure WiFi credentials
5. ✓ Build and upload firmware
6. ✓ Monitor serial output
7. ✓ View data in dashboard

---

## 💡 Tips

- **Quick Backend Restart**: Close backend window, run `start-backend.bat`
- **Test WiFi First**: Use `testWiFi.ino` before main project
- **Check Logs**: Monitor window shows real-time debug output
- **Use Mock Data**: Set `ENABLE_MOCK_DATA=true` for testing UI

---

## 📞 Support

For issues:
1. Check serial monitor output
2. Review backend logs: `iot_backend/backend/logs/`
3. Verify all prerequisites are installed
4. Try `--help` option for scripts

---

**Happy coding! 🎉**
