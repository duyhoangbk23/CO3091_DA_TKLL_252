# 🌐 IoT RTOS Project

Complete IoT monitoring system with ESP32 microcontroller, RTOS tasks, Node.js backend, and real-time dashboard.

---

## 🚀 Quick Start (30 seconds)

### Windows
```bash
run.bat
```

### macOS / Linux
```bash
chmod +x run.sh
./run.sh
```

### Any Platform
```bash
npm start
```

**That's it!** The startup script will:
- ✓ Check prerequisites
- ✓ Install dependencies
- ✓ Start backend server
- ✓ Open dashboard in browser

---

## 📊 System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   ESP32     │◄───────►│   MQTT       │◄───────►│  Node.js    │
│  (Sensors)  │         │   Broker     │         │  Backend    │
└─────────────┘         └──────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  MySQL      │
                                                 │  Database   │
                                                 └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Static     │◄───────►│  Dashboard  │
│  (Chrome)   │         │   Server     │         │  (HTML/JS)  │
└─────────────┘         └──────────────┘         └─────────────┘
```

---

## 📁 Project Structure

```
IOT_RTOS_Project/
│
├── 🚀 Startup Scripts
│   ├── run.bat                 # Windows (Recommended)
│   ├── run.ps1                 # PowerShell
│   ├── run.sh                  # macOS/Linux
│   └── startup-manager.js      # Node.js (Cross-platform)
│
├── 🔧 Hardware (ESP32)
│   ├── hardware/main/
│   │   ├── main.ino            # Main firmware
│   │   ├── SensorHub.h/.cpp    # Sensor management
│   │   ├── IaqController.h/.cpp# IAQ control
│   │   └── ...
│   └── hardware/test/
│       └── testWiFi/           # WiFi test sketch
│
├── 🔄 RTOS (Real-Time OS)
│   ├── rtos/src/
│   │   ├── main.cpp            # RTOS main
│   │   ├── task_mqtt.cpp       # MQTT task
│   │   ├── task_sensor.cpp     # Sensor task
│   │   └── ...
│   └── rtos/include/
│       ├── config.h            # RTOS config
│       └── tasks.h             # Task definitions
│
├── 🌐 Backend (Node.js + Express)
│   └── iot_backend/backend/
│       ├── src/
│       │   ├── app.js          # Express app
│       │   ├── server.js       # Server entry
│       │   ├── controllers/    # API handlers
│       │   ├── routes/         # API routes
│       │   ├── models/         # DB queries
│       │   └── mqtt/           # MQTT client
│       └── package.json        # Dependencies
│
├── 💻 Frontend (Dashboard)
│   └── iot_backend/frontend/
│       └── public/
│           ├── index.html      # Main dashboard
│           ├── analytics.html  # Analytics
│           ├── control.html    # Control panel
│           └── js/css/         # Static assets
│
└── 📚 Documentation
    ├── README.md               # This file
    ├── STARTUP_GUIDE.md        # Detailed startup
    ├── SCRIPTS_REFERENCE.md    # All scripts
    ├── DEVELOPMENT_GUIDE.md    # Development setup
    └── platformio.ini          # PlatformIO config
```

---

## 🎯 Features

### Hardware (ESP32)
- ✓ Multiple sensor support (PM2.5, CO2, Temperature, Humidity, VOC)
- ✓ RS485/Modbus communication
- ✓ Real-time data processing
- ✓ WiFi connectivity
- ✓ MQTT pub/sub
- ✓ CSV logging
- ✓ Alert system

### RTOS (Real-Time OS)
- ✓ 5+ concurrent tasks
- ✓ Priority-based scheduling
- ✓ Mutex & Semaphore synchronization
- ✓ Queue-based communication
- ✓ Task health monitoring

### Backend API
- ✓ Express.js REST API
- ✓ MQTT broker integration
- ✓ MySQL database
- ✓ WebSocket real-time updates
- ✓ JWT authentication
- ✓ Rate limiting & CORS
- ✓ Error handling & logging

### Frontend Dashboard
- ✓ Real-time sensor data
- ✓ Interactive charts & analytics
- ✓ Device control panel
- ✓ Responsive design
- ✓ Dark/Light theme (planned)
- ✓ Mobile-friendly

---

## 📋 Requirements

### Hardware
- ESP32 development board
- USB cable (for serial connection)
- WiFi router (2.4GHz)

### Software
- **Node.js** v14+ ([download](https://nodejs.org/))
- **npm** v6+ (included with Node.js)
- **PlatformIO** (install: `pip install platformio`)
- **MySQL** (optional, for full feature set)

### Browser
- Chrome, Firefox, Safari, or Edge (latest version)

---

## 🔧 Installation & Setup

### 1. Prerequisites Check
```bash
node --version        # Should be v14+
npm --version         # Should be v6+
platformio --version  # Should be installed
```

### 2. First Run
```bash
# Windows
run.bat

# macOS/Linux
./run.sh

# Any platform
npm start
```

### 3. Configure WiFi (Important!)
Edit `hardware/main/main.ino` or look for `Pins.h`:
```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASS "Your_WiFi_Password"
```

### 4. Build & Upload Firmware
```bash
# Using startup script
build-firmware.bat

# Or manual
platformio run --target upload --environment esp32dev
```

### 5. Monitor Connection
```bash
platformio device monitor --baud 115200
```

---

## 🌐 Access Dashboard

After startup, open your browser:

| Page | URL |
|------|-----|
| **Main Dashboard** | http://localhost:3001/public/index.html |
| **Analytics** | http://localhost:3001/public/analytics.html |
| **Control Panel** | http://localhost:3001/public/control.html |
| **API** | http://localhost:3001/api |

---

## 🚀 Running the Project

### Option 1: Batch Script (Windows - Easiest)
```bash
run.bat
```

### Option 2: PowerShell Script (Windows Modern)
```powershell
.\run.ps1
.\run.ps1 -BackendOnly -NoBuild
```

### Option 3: Shell Script (macOS/Linux)
```bash
./run.sh
```

### Option 4: npm (Any Platform)
```bash
npm start              # Full startup
npm run backend        # Backend only
npm run upload         # Build and upload
npm run monitor        # Serial monitor
```

### Option 5: Manual (Full Control)
```bash
# Terminal 1: Backend
cd iot_backend/backend
npm start

# Terminal 2: Serial Monitor
platformio device monitor --baud 115200

# Terminal 3: Manual build (when needed)
platformio run --target upload --environment esp32dev

# Browser: Open http://localhost:3001
```

---

## 📖 Documentation

- **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** - Complete startup instructions
- **[SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md)** - All available scripts
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development setup
- **[hardware/README.md](./hardware/README.md)** - Hardware details
- **[iot_backend/backend/README.md](./iot_backend/backend/README.md)** - API documentation
- **[iot_backend/frontend/README.md](./iot_backend/frontend/README.md)** - Frontend guide

---

## 🔌 Testing ESP32 Connection

### WiFi Test (Before Main Project)
```bash
cd hardware/test/testWiFi
platformio run --target upload --environment esp32dev
platformio device monitor --baud 115200
```

### What to Expect
```
========================================
   WiFi Connection Test for ESP32
========================================

✓ Node.js found
✓ npm found
✓ PlatformIO found

Building firmware...
✓ Firmware built successfully

Starting backend...
✓ Backend started on port 3001

Opening browser...
✓ Frontend opened

Available at:
  Dashboard: http://localhost:3001/public/index.html
  API: http://localhost:3001/api
```

---

## 🛠 Common Commands

```bash
# Startup
npm start                   # Full project
npm run backend             # Backend only
npm run backend:dev         # Development mode

# ESP32
npm run build:firmware      # Build firmware
npm run upload              # Build and upload
npm run monitor             # Serial monitor
npm run clean               # Clean build

# Database
npm run db:migrate          # Run migrations
npm run db:seed             # Seed data

# Development
npm test                    # Run tests
npm run lint                # Linting
npm run setup               # Install dependencies
```

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is free
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# Kill process if needed
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

### ESP32 not uploading
```bash
# Check serial port
platformio device list

# Disconnect, wait 5 seconds, reconnect
# Then try upload again
```

### WiFi connection fails
- Check SSID and password (case-sensitive)
- Ensure 2.4GHz WiFi (not 5GHz)
- Router must be nearby
- Check firewall settings

### Port already in use
```bash
# Change port in .env
PORT=3000 npm start
```

---

## 📞 Support & Help

1. **Read Documentation**: Check [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
2. **Check Logs**: Monitor window shows debug output
3. **Serial Monitor**: See ESP32 status: `npm run monitor`
4. **API Tests**: Available at http://localhost:3001/api

---

## 📝 Development Workflow

### Adding a New Sensor
1. Add sensor driver in `hardware/main/`
2. Update `SensorHub.h/cpp`
3. Add MQTT topic in `common/mqtt_topics.h`
4. Update backend model
5. Update dashboard UI

### Adding an API Endpoint
1. Create controller method
2. Add route definition
3. Update database model
4. Document in API docs
5. Add frontend call

### Deploying to Production
1. Set `NODE_ENV=production`
2. Use Docker: `docker-compose up -d`
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS
5. Configure DNS

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Microcontroller** | ESP32 (Arduino Framework) |
| **RTOS** | FreeRTOS |
| **Real-time OS** | Custom RTOS Tasks |
| **Messaging** | MQTT (PubSubClient) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |
| **Frontend** | HTML5 + CSS3 + JavaScript |
| **Communication** | REST API + WebSocket |
| **Authentication** | JWT |
| **Logging** | Winston.js |

---

## 📄 License

MIT License - See LICENSE file

---

## 👥 Contributors

- Your Name - [GitHub](https://github.com)

---

## 🎉 Quick Links

- **[Start Startup Guide](./STARTUP_GUIDE.md)** - 👈 Start here!
- **[Scripts Reference](./SCRIPTS_REFERENCE.md)** - All available commands
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup & architecture
- **[API Documentation](./iot_backend/backend/README.md)** - REST API endpoints
- **[Hardware Setup](./hardware/README.md)** - Hardware configuration

---

**Ready to start? Run `run.bat` (Windows) or `./run.sh` (Mac/Linux) now!** 🚀
