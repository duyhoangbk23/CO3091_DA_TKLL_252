# 🎯 Getting Started - 2 Minute Quick Start

## Option 1: Run Everything (Recommended)

### Windows
```bash
run.bat
```

### macOS/Linux
```bash
./run.sh
```

### Result
- ✓ Backend starts on port 3001
- ✓ Browser opens to http://localhost:3001
- ✓ Ready for ESP32 connection

---

## Option 2: Using npm (Any Platform)

```bash
npm start
```

Then open browser: http://localhost:3001

---

## Option 3: Node.js Cross-Platform

```bash
node startup-manager.js
```

---

## 📱 Next: Connect Your ESP32

### 1. Update WiFi Credentials

Edit `hardware/main/main.ino`:

```cpp
#define WIFI_SSID "Your_WiFi"
#define WIFI_PASS "Your_Password"
```

### 2. Build & Upload

Windows:
```bash
build-firmware.bat
# Choose: 2. Build and upload
```

Any Platform:
```bash
npm run upload
```

### 3. Monitor Connection

```bash
npm run monitor
```

Look for:
```
[WiFi] Dang ket noi...
[WiFi] Da ket noi! IP: 192.168.1.100
[MQTT] Connected!
```

### 4. Check Dashboard

Open http://localhost:3001 and see live sensor data!

---

## 🔗 Available URLs

- **Dashboard**: http://localhost:3001/public/index.html
- **Analytics**: http://localhost:3001/public/analytics.html
- **Control**: http://localhost:3001/public/control.html
- **API**: http://localhost:3001/api

---

## 📚 Full Documentation

- **[README.md](./README.md)** - Project overview
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Step-by-step setup
- **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** - Detailed startup guide
- **[SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md)** - All available scripts

---

## ⚙️ Useful Commands

```bash
npm start              # Start everything
npm run backend        # Backend only
npm run upload         # Build and upload firmware
npm run monitor        # Serial monitor (115200 baud)
npm run clean          # Clean build files
npm test               # Run tests
npm run lint           # Linting
```

---

## ⚠️ Requirements

- Node.js v14+ (get from https://nodejs.org/)
- PlatformIO (install: `pip install platformio`)
- ESP32 dev board + USB cable
- 2.4GHz WiFi

---

**That's it! You're ready to go! 🚀**

Problems? Check [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) or [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
