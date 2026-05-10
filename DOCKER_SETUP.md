# Docker Setup Guide

Complete Docker setup for the IoT RTOS project with MySQL, MQTT, Node.js backend, and Nginx frontend.

## 📋 Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- 2GB free disk space

## 🚀 Quick Start

### 1. Clone or Enter Project Directory
```bash
cd d:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252
```

### 2. Configure Environment (Optional)
The project includes a root `.env` file with defaults. To customize:
```bash
# Edit the .env file
# Adjust DB_PASSWORD, PORT, etc. as needed
```

### 3. Start All Services
```bash
docker-compose up -d
```

This will start:
- **MySQL Database** (port 3306)
- **MQTT Broker** (port 1883, WebSocket on 9001)
- **Node.js Backend** (port 3000)
- **Nginx Frontend** (port 8080)

### 4. Verify Services Are Running
```bash
# Check all containers
docker-compose ps

# Expected output:
# CONTAINER ID   IMAGE               PORTS
# ...            mysql:8.0           3306->3306
# ...            eclipse-mosquitto   1883->1883
# ...            (backend image)     3000->3000
# ...            nginx:alpine        8080->80
```

### 5. Test Backend API
```bash
# Get latest sensor data
curl http://localhost:3000/api/data

# Get historical data
curl "http://localhost:3000/api/history?limit=10&hours=24"

# Expected response:
# {"device_id":"esp32_device","temperature":25.5,"humidity":60.0,...}
```

### 6. Access Frontend
Open in browser: **http://localhost:8080**

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│        Nginx (Frontend)                 │
│        http://localhost:8080            │
└──────────────┬──────────────────────────┘
               │ Static files + SPA routing
               │ API proxy to backend
               │
┌──────────────▼──────────────────────────┐
│    Node.js Backend (Express)            │
│    http://localhost:3000                │
│                                         │
│  /api/data         → GET sensor data    │
│  /api/history      → GET historical data│
│  /api/control      → POST commands      │
└──────┬───────────────────────┬──────────┘
       │                       │
   MQTT│                   MySQL │
       │                    │
┌──────▼──┐            ┌────▼─────────┐
│ MQTT    │            │  MySQL 8.0   │
│ Broker  │            │  (port 3306) │
│(1883)   │            │              │
└──────┬──┘            │  sensor_data │
       │               │  control_log │
       │               └──────────────┘
       │ MQTT Topics
       │
   ┌───▼──────────────────┐
   │  ESP32 Device        │
   │  (via WiFi)          │
   │                      │
   │  Publishes:          │
   │  sensor/esp32/data   │
   │                      │
   │  Subscribes:         │
   │  sensor/esp32/command│
   └──────────────────────┘
```

---

## 📁 Volumes

Persistent data is stored in Docker volumes:

- **mysql_data**: MySQL database files
- **mosquitto_data**: MQTT retained messages
- **mosquitto_logs**: MQTT logs

Data persists even if containers are stopped/removed.

To see volumes:
```bash
docker volume ls | grep iot
```

---

## 🛠️ Common Commands

### Start/Stop Services
```bash
# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Data loss!)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f mqtt

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Access Container Shell
```bash
# Backend container
docker-compose exec backend sh

# MySQL container
docker-compose exec mysql bash

# MQTT container
docker-compose exec mqtt sh
```

### Run Commands in Container
```bash
# Check MySQL tables
docker-compose exec mysql mysql -u iot_user -p iot_db -e "SHOW TABLES;"

# View MQTT topics (requires mosquitto_sub)
docker-compose exec mqtt mosquitto_sub -h localhost -t "#" -v
```

---

## 🧪 Testing Services

### 1. Test Backend API
```bash
# Method 1: Using curl
curl http://localhost:3000/api/data

# Method 2: Using Postman
# Import: GET http://localhost:3000/api/data

# Expected response:
{
  "device_id": "esp32_device",
  "temperature": 25.5,
  "humidity": 60.0,
  "timestamp": "2026-05-11T10:30:45Z",
  "status": "online"
}
```

### 2. Test MQTT Connection
```bash
# Subscribe to sensor data topic
docker-compose exec mqtt mosquitto_sub -h localhost -t "sensor/esp32/data" -v

# In another terminal, publish test data
docker-compose exec mqtt mosquitto_pub -h localhost -t "sensor/esp32/data" \
  -m '{"temperature":25.5,"humidity":60.0}'
```

### 3. Test MySQL Connection
```bash
# Check if database and tables exist
docker-compose exec mysql mysql -u iot_user -piot_password iot_db \
  -e "SHOW TABLES; SELECT * FROM sensor_data LIMIT 5;"
```

### 4. Test Frontend
Open browser: **http://localhost:8080**
- Should load dashboard
- Check browser console for any API errors

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port (e.g., port 3000)
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Solution: Change port in .env file or stop conflicting service
```

### MySQL Connection Failed
```bash
# Check MySQL container logs
docker-compose logs mysql

# Ensure MySQL is fully initialized (wait 10-15 seconds)
docker-compose ps  # Look for healthy status

# Try reconnecting after a moment
docker-compose restart mysql
```

### MQTT Connection Failed
```bash
# Check MQTT logs
docker-compose logs mqtt

# Test MQTT broker directly
docker-compose exec mqtt mosquitto_sub -h localhost -t "test"
```

### Backend Can't Connect to Database
```bash
# Verify connection settings in .env
# Database host should be 'mysql' (not localhost) when using Docker

# Check logs
docker-compose logs backend

# Restart backend after ensuring MySQL is ready
docker-compose restart backend
```

### Frontend Shows 404
```bash
# Check nginx logs
docker-compose logs frontend

# Verify frontend files are mounted
docker-compose exec frontend ls -la /usr/share/nginx/html
```

---

## 📈 Performance

### Monitor Resource Usage
```bash
# Real-time stats
docker stats

# Specific container
docker stats iot-backend
```

### Database Optimization
```bash
# Check query performance
docker-compose exec mysql mysql -u iot_user -piot_password iot_db \
  -e "SHOW STATUS LIKE '%temp%';"

# Monitor active connections
docker-compose exec mysql mysql -u iot_user -piot_password iot_db \
  -e "SHOW PROCESSLIST;"
```

---

## 🔒 Security Notes

### For Production
1. **Change default passwords** in `.env`
   ```
   DB_PASSWORD=change_to_strong_password
   ```

2. **Enable MQTT authentication**
   - Edit `mosquitto.conf`
   - Add authentication credentials

3. **Use HTTPS**
   - Configure SSL certificates in nginx
   - Update CORS_ORIGIN to https://

4. **Limit MQTT publishing**
   - Restrict topics that can be published
   - Validate MQTT messages

### For Development
- Current setup allows anonymous access
- Suitable for local development only
- Add authentication before production deployment

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Official Image](https://hub.docker.com/_/mysql)
- [Mosquitto MQTT Broker](https://mosquitto.org/)
- [Nginx Official Image](https://hub.docker.com/_/nginx)

---

## ✅ Verification Checklist

- [ ] All 4 containers running: `docker-compose ps`
- [ ] Backend responds: `curl http://localhost:3000/api/data`
- [ ] MySQL tables created: `docker-compose exec mysql mysql ... SHOW TABLES;`
- [ ] MQTT broker listening: `mosquitto_sub -h localhost -t "test"`
- [ ] Frontend loads: Browser → http://localhost:8080
- [ ] Logs look healthy: `docker-compose logs --tail=50`

---

## 🆘 Support

If issues persist:
1. Check logs: `docker-compose logs`
2. Verify ports are not in use
3. Ensure Docker/Docker Compose versions are updated
4. Review `.env` file for typos
5. Try: `docker-compose down && docker-compose up -d`

