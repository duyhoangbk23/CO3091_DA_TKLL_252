# ✅ IoT RTOS Project - Setup Checklist

Complete this checklist to get the project running end-to-end.

---

## 📋 Pre-Flight Checklist

### ✓ Hardware & Prerequisites

- [ ] ESP32 development board connected to USB
- [ ] USB drivers installed (CH340 if needed)
- [ ] Node.js v14+ installed (`node --version`)
- [ ] npm v6+ installed (`npm --version`)
- [ ] PlatformIO available (`platformio --version`)
- [ ] Terminal/Command Prompt access
- [ ] Text editor or VS Code
- [ ] WiFi credentials available (SSID & password)

---

## 🚀 Step 1: First Run (5 minutes)

### [ ] Start the Full Project

**Windows:**
```bash
run.bat
```

**macOS/Linux:**
```bash
chmod +x run.sh
./run.sh
```

**Any Platform:**
```bash
npm start
```

### [ ] Verify Backend Started

- Backend window shows: "Server listening on port 3001"
- Dashboard opens automatically in browser
- Check: http://localhost:3001

### [ ] Check Dashboard Access

- [ ] Main Dashboard: http://localhost:3001/public/index.html
- [ ] Analytics: http://localhost:3001/public/analytics.html
- [ ] Control Panel: http://localhost:3001/public/control.html
- [ ] API: http://localhost:3001/api/health (should show `{"status":"OK"}`)

---

## 🔧 Step 2: Configure ESP32 (5 minutes)

### [ ] Set WiFi Credentials

Edit `hardware/main/main.ino` (or `hardware/main/Pins.h`):

```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASS "Your_WiFi_Password"
```

**OR** edit `rtos/include/config.h`:

```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASS "Your_WiFi_Password"
#define MQTT_SERVER "localhost"  // or your backend IP
#define MQTT_PORT 1883
#define DEVICE_ID "esp32_1"
```

### [ ] Update Backend .env (Optional)

Edit `iot_backend/backend/.env`:

```env
MQTT_SERVER=localhost
MQTT_PORT=1883
WIFI_SSID=Your_WiFi_Name
WIFI_PASS=Your_WiFi_Password
```

---

## 🔨 Step 3: Build ESP32 Firmware (5 minutes)

### [ ] Option A: Using Build Script (Windows)

```bash
build-firmware.bat

# Select option:
# 2. Build and upload to ESP32
```

### [ ] Option B: Manual Build

```bash
platformio run --target upload --environment esp32dev
```

### [ ] Verify Upload

- See: "Leaving... Hard resetting via RTS pin"
- ESP32 will restart and connect to WiFi
- Look for blue LED on ESP32 (optional indicator)

---

## 🔌 Step 4: Monitor ESP32 Connection (3 minutes)

### [ ] Start Serial Monitor

```bash
platformio device monitor --environment esp32dev --baud 115200
```

### [ ] Verify WiFi Connection

Expected output:
```
[WiFi] Dang ket noi...
.....
[WiFi] Da ket noi! IP: 192.168.1.100
```

### [ ] Verify MQTT Connection

Expected output:
```
[MQTT] Connecting...
[MQTT] Connected!
```

### [ ] Verify Data Publishing

Expected output:
```
[MQTT] Publishing: sensor_data/esp32_1
```

Keep this window open to monitor real-time output!

---

## 📊 Step 5: Verify Dashboard Updates (2 minutes)

### [ ] Check Dashboard

Open: http://localhost:3001/public/index.html

### [ ] Verify Real-time Data

- [ ] See ESP32 device ID in device list
- [ ] See sensor readings updating
- [ ] Temperature/Humidity showing
- [ ] PM2.5/CO2/VOC values displaying
- [ ] Timestamp updating

### [ ] Check Control Panel

Open: http://localhost:3001/public/control.html

- [ ] Can see control commands
- [ ] ESP32 responds to commands
- [ ] Status updates reflect device state

---

## 🧪 Step 6: Test Components (10 minutes)

### [ ] Test WiFi Only (Optional)

```bash
# Upload WiFi test firmware
cd hardware/test/testWiFi
platformio run --target upload --environment esp32dev

# Monitor
platformio device monitor --baud 115200

# Check for:
# - WiFi networks found
# - Connection successful
# - Signal strength
# - Ping test passing
```

### [ ] Test Backend API

```bash
# Get sensor data
curl http://localhost:3001/api/sensors

# Get control status
curl http://localhost:3001/api/control

# Send control command
curl -X POST http://localhost:3001/api/control \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32_1","command":"ON"}'
```

### [ ] Test Database (Optional)

```bash
# Connect to MySQL
mysql -h localhost -u root -p

# Check database
USE iot_database;
SHOW TABLES;
SELECT * FROM sensors LIMIT 5;
```

---

## 🎯 Step 7: Verify Full Integration (5 minutes)

### [ ] End-to-End Test

1. [ ] ESP32 connected to WiFi ✓
2. [ ] ESP32 publishing to MQTT ✓
3. [ ] Backend receiving MQTT messages ✓
4. [ ] Backend saving to database ✓
5. [ ] Frontend showing live data ✓
6. [ ] Control commands working ✓
7. [ ] Serial monitor showing activity ✓

---

## 📈 Optional: Advanced Setup

### [ ] Docker Deployment (Optional)

```bash
# Start all services in Docker
docker-compose up -d

# Services running:
# - Mosquitto: mqtt://localhost:1883
# - MySQL: localhost:3306
# - Backend: http://localhost:3001
# - PHPMyAdmin: http://localhost:8080 (with --profile debug)

# View logs
docker-compose logs -f backend
```

### [ ] Database Migration (Optional)

```bash
cd iot_backend/backend
npm run db:migrate
npm run db:seed
```

### [ ] Enable Authentication (Optional)

```bash
# Set JWT secret in .env
JWT_SECRET=your-secret-key

# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Use token for authenticated requests
curl http://localhost:3001/api/sensors \
  -H "Authorization: Bearer <token>"
```

---

## 🐛 Troubleshooting

### Issue: ESP32 won't upload

```bash
# Solution 1: Disconnect and reconnect USB
# Wait 2-3 seconds before retry

# Solution 2: Hold BOOT button while uploading
# Release when upload starts

# Solution 3: Check serial port
platformio device list

# Solution 4: Erase flash and retry
esptool.py --port /dev/ttyUSB0 erase_flash
platformio run --target upload --environment esp32dev
```

### Issue: WiFi won't connect

- [ ] Check SSID and password (case-sensitive!)
- [ ] Ensure router is 2.4GHz (not 5GHz)
- [ ] Check signal strength (should be > -70 dBm)
- [ ] Router must allow ESP32 to connect
- [ ] Try WiFi test: `hardware/test/testWiFi/`

### Issue: Dashboard shows no data

- [ ] Check Serial Monitor - is MQTT connecting?
- [ ] Check Backend logs: `tail -f iot_backend/backend/logs/app.log`
- [ ] Check MQTT broker: `mosquitto_sub -h localhost -t "$SYS/#"`
- [ ] Verify firewall allows port 1883 (MQTT)

### Issue: Backend won't start

```bash
# Check port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# Kill if needed
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux

# Check dependencies
cd iot_backend/backend
npm install
npm start
```

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `run.bat` | Start everything (Windows) |
| `./run.sh` | Start everything (Mac/Linux) |
| `npm start` | Start everything (any platform) |
| `npm run backend` | Backend only |
| `npm run monitor` | Serial monitor |
| `npm run upload` | Build and upload |
| `npm test` | Run tests |

---

## 📚 Documentation Links

- **[README.md](./README.md)** - Project overview
- **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** - Detailed startup
- **[SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md)** - All scripts
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development setup

---

## ✨ Success Criteria

**Project is working when:**

- [ ] ✓ Backend server running on port 3001
- [ ] ✓ Dashboard opens in browser
- [ ] ✓ ESP32 connects to WiFi
- [ ] ✓ Serial monitor shows messages
- [ ] ✓ Dashboard receives sensor data
- [ ] ✓ Real-time updates visible
- [ ] ✓ Control commands working
- [ ] ✓ No errors in console

---

## 🎉 Next Steps

After successful setup:

1. **Customize Sensors** - Add new sensor types
2. **Add Features** - Extend API, add UI pages
3. **Deploy to Production** - Use Docker or cloud
4. **Monitor Performance** - Set up alerts
5. **Scale Hardware** - Add more ESP32 devices

---

**Congratulations! Your IoT system is running! 🚀**

For issues, check the troubleshooting section or documentation files.
