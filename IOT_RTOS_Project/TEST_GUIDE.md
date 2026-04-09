# IoT Project - Quick Test Guide

## 🧪 Testing the System

### 1. Test Backend API (using curl or Postman)

#### Test Real-time Data Endpoint
```bash
# Get latest sensor data
curl http://localhost:3000/api/data
```

Expected response:
```json
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

#### Test Historical Data Endpoint
```bash
# Get last 100 records from last 24 hours
curl "http://localhost:3000/api/history?limit=100&hours=24"
```

#### Test Control Command
```bash
# Send ON command
curl -X POST http://localhost:3000/api/control \
  -H "Content-Type: application/json" \
  -d '{"device_id": "esp32_sensor_001", "command": "ON"}'
```

#### Test Health Check
```bash
# Check server status
curl http://localhost:3000/health
```

#### Test Statistics
```bash
# Get statistics
curl http://localhost:3000/api/stats
```

---

### 2. Test Frontend Pages

#### Open in Browser
1. **Dashboard (Real-time)**
   - URL: `file:///path/to/public/index.html`
   - Expected: Temperature and humidity displayed, auto-refresh every 2s

2. **Analytics (History)**
   - URL: `file:///path/to/public/analytics.html`
   - Click "Load Data" button
   - Expected: Charts and data table populate

3. **Control Panel**
   - URL: `file:///path/to/public/control.html`
   - Click quick command buttons
   - Expected: Command history updates

---

### 3. Verify Database Connection

#### Check if data is being saved
```bash
# Login to MySQL
mysql -u root -p iot_db

# Query data
SELECT COUNT(*) as total_records FROM sensor_data;
SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 5;
SELECT * FROM control_log;
```

---

### 4. Verify Mock Data Generation

#### Monitor Server Output
```bash
# Run backend with debug output
npm start

# You should see line like:
# 📊 Mock data updated: 25.3°C, 62.1% RH
# Every 2 seconds
```

---

### 5. Test Auto-refresh on Dashboard

1. Open Dashboard page
2. Note the "Last update" timestamp
3. Wait 2 seconds
4. Verify timestamp and sensor values change
5. Check console for any errors: F12 → Console tab

---

### 6. Test Data Export (Analytics Page)

1. Open Analytics page
2. Click "Load Data"
3. Wait for charts to populate
4. Click "Export CSV"
5. Verify CSV file downloads with sensor data

---

### 7. Monitor Browser Console

Press F12 to open Developer Tools → Console tab

Expected logs:
```javascript
Dashboard initialized
Mock data updated...
API call successful
Chart render complete
```

Errors to watch for:
- `CORS error` → Backend not running
- `Failed to fetch` → API endpoint not responding
- `undefined` → Data structure mismatch

---

## 🔍 Common Test Scenarios

### Scenario 1: Cold Start (Fresh Installation)
1. Setup database: `mysql < schema.sql`
2. Install dependencies: `npm install`
3. Start server: `npm start`
4. Open frontend
5. Verify data flows through

### Scenario 2: Multiple Dashboard Instances
1. Open Dashboard in multiple tabs
2. All should update simultaneously
3. No data corruption

### Scenario 3: Long-duration Test
1. Keep dashboard open for 1 hour
2. Check database for data accumulation
3. Verify memory usage stable
4. No console errors

### Scenario 4: Database Restart
1. Server running, all good
2. Stop MySQL
3. Dashboard shows "Disconnected"
4. Restart MySQL
5. Dashboard reconnects

### Scenario 5: Control Command Flow
1. Send command from Control panel
2. Command appears in history
3. Check database: `SELECT * FROM control_log`
4. Command status should be 'completed'

---

## 📊 Performance Baseline

### Expected Performance
- **API Response Time**: < 100ms
- **Memory Usage**: < 50MB
- **Database Queries**: < 10ms
- **Frontend Update**: < 500ms
- **Mock Data Generation**: Every 2 seconds

### Monitor Performance
```bash
# Check memory usage
top -p $(pgrep -f "node src/server.js")

# Check MySQL queries
SHOW PROCESSLIST;

# Check response times
curl -w "\nTotal time: %{time_total}s\n" http://localhost:3000/api/data
```

---

## 🐛 Debug Checklist

Before reporting issues, verify:

- [ ] Node.js v14+ installed: `node --version`
- [ ] MySQL running: `mysql -u root -p -e "SELECT 1"`
- [ ] Dependencies installed: `npm list`
- [ ] Database created: `mysql -u root -p -e "USE iot_db; SHOW TABLES;"`
- [ ] Backend running: `curl http://localhost:3000/health`
- [ ] Frontend loads: Open HTML file in browser
- [ ] No console errors: Press F12 → Console
- [ ] .env file exists and readable
- [ ] Port 3000 available: `netstat -an | grep 3000`

---

## 🚨 Emergency Reset

If something goes wrong:

### 1. Full Reset
```bash
# Stop backend
Ctrl+C

# Reset database
mysql -u root -p iot_db < database/schema.sql

# Clear node modules
rm -rf node_modules

# Reinstall
npm install

# Restart
npm start
```

### 2. Reset Frontend Data
- Open Controls panel → "Clear History"
- Or clear browser cache: Ctrl+Shift+Delete

### 3. Reset Database Only
```bash
# Backup old data
cp iot_db_backup.sql iot_db_backup_$(date +%s).sql

# Recreate
DROP DATABASE iot_db;
CREATE DATABASE iot_db;
USE iot_db;
source schema.sql;
```

---

## 📈 Load Testing Commands

### Generate load with sequential requests
```bash
# 100 requests to /api/data
for i in {1..100}; do
  curl -s http://localhost:3000/api/data > /dev/null
  echo "Request $i completed"
done
```

### Monitor database growth
```bash
# Check record count every 5 seconds
watch -n 5 "mysql -u root -p -e 'SELECT COUNT(*) FROM iot_db.sensor_data;'"
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 3000
- [ ] Frontend loads without errors
- [ ] Real-time data updates every 2 seconds
- [ ] Historical data loads from database
- [ ] Charts render correctly
- [ ] Control commands execute
- [ ] CSV export works
- [ ] No console errors
- [ ] Database saving data
- [ ] Settings persist in localStorage

---

**If all checks pass, your IoT system is ready for use!** ✨
