# IoT Project - Development Setup Guide

## 📋 Project Overview

This is a complete IoT monitoring system with:
- **Backend**: Node.js + Express API server
- **Frontend**: HTML/CSS/JavaScript dashboard
- **Database**: MySQL for historical data storage
- **Mock Data**: Automatic sensor data generation for demos

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js (v14+)
- MySQL Server
- npm or yarn

### Step 1: Database Setup

```bash
# Create database and tables
mysql -u root -p < IOT_RTOS_Project/iot_backend/database/schema.sql
```

**Default Database Credentials:**
- Host: `localhost`
- User: `root`
- Password: `root`
- Database: `iot_db`

If you use different credentials, update `.env` file before starting the server.

### Step 2: Install Backend Dependencies

```bash
cd IOT_RTOS_Project/iot_backend/backend

npm install
```

### Step 3: Configure Environment

The `.env` file is already created with default settings. If you need to change them, edit:

```bash
IOT_RTOS_Project/iot_backend/backend/.env
```

### Step 4: Start Backend Server

```bash
# From IOT_RTOS_Project/iot_backend/backend/
npm start

# Or with development mode
npm run dev
```

Expected output:
```
==================================================
🚀 IoT Backend Server
==================================================
✓ Server running on port 3000
📊 Mock data generator: ACTIVE (2s interval)
🔗 API Base URL: http://localhost:3000
==================================================
```

### Step 5: Open Frontend

Open your browser and navigate to:
- **Dashboard**: `file:///path/to/IOT_RTOS_Project/iot_backend/frontend/public/index.html`

Or use a local server (recommended):
```bash
# Using Python 3
cd IOT_RTOS_Project/iot_backend/frontend/public
python -m http.server 8000

# Then open: http://localhost:8000
```

---

## 📁 Project Structure

```
IOT_RTOS_Project/
│
├── iot_backend/
│   ├── backend/
│   │   ├── src/
│   │   │   └── server.js              # Main Express server
│   │   ├── package.json               # Node dependencies
│   │   ├── .env                       # Configuration
│   │   └── README.md
│   │
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── index.html             # Dashboard (real-time)
│   │   │   ├── analytics.html         # Analytics (history)
│   │   │   ├── control.html           # Device control
│   │   │   ├── css/
│   │   │   │   └── style.css          # Global styles
│   │   │   └── js/
│   │   │       ├── services/
│   │   │       │   └── api.js         # API service functions
│   │   │       ├── dashboard.js       # Dashboard logic
│   │   │       ├── analytics.js       # Analytics logic
│   │   │       └── control.js         # Control logic
│   │   └── README.md
│   │
│   └── database/
│       ├── schema.sql                 # Database tables
│       └── README.md
```

---

## 🔌 API Endpoints

### Real-time Data (from memory)
```bash
GET http://localhost:3000/api/data

# Response:
{
  "success": true,
  "data": {
    "device_id": "esp32_sensor_001",
    "temperature": 25.3,
    "humidity": 62.1,
    "timestamp": "2024-01-15T10:30:45Z",
    "status": "online"
  },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### Historical Data (from MySQL)
```bash
GET http://localhost:3000/api/history?limit=100&hours=24

# Parameters:
#   limit: number of records (default: 100, max: 1000)
#   hours: time range in hours (default: 24)

# Response:
{
  "success": true,
  "count": 100,
  "data": [
    {
      "id": 1,
      "device_id": "esp32_sensor_001",
      "temperature": 25.3,
      "humidity": 62.1,
      "created_at": "2024-01-15T10:30:45Z"
    },
    ...
  ],
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### Device Control
```bash
POST http://localhost:3000/api/control

# Request body:
{
  "device_id": "esp32_sensor_001",
  "command": "ON"
}

# Valid commands: ON, OFF, RESET, CALIBRATE

# Response:
{
  "success": true,
  "message": "Command \"ON\" sent to device \"esp32_sensor_001\"",
  "result": {
    "device_id": "esp32_sensor_001",
    "command": "ON",
    "status": "executed",
    "timestamp": "2024-01-15T10:30:45Z"
  }
}
```

### Statistics
```bash
GET http://localhost:3000/api/stats

# Response:
{
  "success": true,
  "data": {
    "total_records": 1200,
    "avg_temperature": 24.7,
    "max_temperature": 32.5,
    "min_temperature": 18.2,
    "avg_humidity": 61.3
  }
}
```

### Health Check
```bash
GET http://localhost:3000/health

# Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45Z",
  "database": "connected"
}
```

---

## 🎨 Frontend Features

### Dashboard (`index.html`)
- Real-time temperature and humidity display
- Device status indicator
- Auto-refresh every 2 seconds
- Responsive, mobile-friendly design
- Quick navigation to other pages

### Analytics (`analytics.html`)
- Historical data display
- Temperature and humidity charts (Chart.js)
- Statistics summary
- Data table with filtering
- Export to CSV functionality
- Time range selection (1h, 6h, 24h, 7d, 30d)

### Control (`control.html`)
- Send commands to devices
- Quick command buttons
- Command history display
- Device settings panel
- Command queue tracking

---

## 📊 Mock Data

The backend automatically generates mock sensor data every 2 seconds:
- **Temperature**: 25°C ± 2°C (realistic variation)
- **Humidity**: 60% ± 5% RH
- **Data storage**: Real-time in memory + history in MySQL

---

## 🔧 Troubleshooting

### Issue: "Cannot find module 'express'"
```bash
# Solution: Install dependencies
npm install
```

### Issue: "MySQL connection failed"
```bash
# Check MySQL is running:
mysql -u root -p -e "SELECT * FROM iot_db.sensor_data LIMIT 1;"

# Or update credentials in .env:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iot_db
```

### Issue: "Cannot GET /api/data" (404 error)
```bash
# Make sure backend server is running:
npm start

# Check if listening on port 3000:
netstat -an | grep 3000
```

### Issue: Frontend can't reach backend (CORS error)
```bash
# Make sure backend is running on http://localhost:3000
# Frontend should load from same or different origin with CORS enabled
```

---

## 📝 Configuration

Edit `.env` file to customize:

```bash
# Backend Server
PORT=3000                              # Server port
NODE_ENV=development                   # Environment

# Database
DB_HOST=localhost                      # MySQL host
DB_USER=root                           # MySQL username
DB_PASSWORD=root                       # MySQL password
DB_NAME=iot_db                         # Database name
DB_PORT=3306                           # MySQL port

# MQTT (not used in demo, but kept for reference)
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC=sensor/+/data

# API
API_BASE_URL=http://localhost:3000
```

---

## 🚦 Data Flow

```
┌─────────────┐
│ Mock Data   │ Updates every 2 seconds
└──────┬──────┘
       │
       ├──→ Memory (latestData) ──→ GET /api/data (realtime)
       │
       └──→ MySQL Database ──→ GET /api/history
```

---

## 📱 Frontend Usage

1. **Dashboard**: Displays latest sensor readings in real-time
2. **Analytics**: View historical data with charts and statistics
3. **Control**: Send commands to devices and view command history

---

## 🔐 Security Notes

⚠️ **This is a demo implementation. For production:**
- Add authentication (JWT tokens)
- Enable HTTPS
- Validate all inputs
- Add rate limiting
- Implement proper error handling
- Use environment variables for all secrets
- Add input sanitization

---

## 📚 Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: MySQL
- **Charts**: Chart.js
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6

---

## 🎯 Next Steps

1. **Add Real MQTT Integration**: Replace mock data with real MQTT
2. **RTOS Implementation**: Connect actual ESP32 device
3. **WebSocket Support**: Real-time updates without polling
4. **User Authentication**: Add login system
5. **Data Persistence**: Implement data archiving
6. **Alerts**: Send email/SMS on threshold breach

---

## 📧 Support

For issues or questions:
1. Check the error logs in terminal
2. Verify database connection
3. Check that backend server is running
4. Ensure frontend can reach backend API

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15
