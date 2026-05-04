# MQTT Protocol Definition for RTOS Implementation

This document defines the MQTT protocol designed and implemented in the Backend. RTOS developers should follow these specifications to ensure compatibility with the Dashboard.

## 📡 MQTT Topics

| Topic | Direction | Purpose | Content Type |
|-------|-----------|---------|--------------|
| `iot/sensor/data` | ESP32 -> Backend | Periodic telemetry | JSON |
| `iot/device/control` | Backend -> ESP32 | Remote control | JSON |

---

## 📊 1. Publish Sensor Data
The ESP32 should publish sensor readings to **`iot/sensor/data`** every 1-10 seconds.

**JSON Format:**
```json
{
  "temperature": 25.5,
  "humidity": 60.0
}
```

*   `temperature`: floating point number (Celsius)
*   `humidity`: floating point number (Percentage)

---

## 🕹️ 2. Subscribe to Controls
The ESP32 must subscribe to **`iot/device/control`** to receive commands from the Dashboard.

**JSON Format:**
```json
{
  "led": "ON"
}
```
OR
```json
{
  "led": "OFF"
}
```

*   `led`: Current supported values are `"ON"` and `"OFF"`.

---

## 🛠️ Implementation Requirements (RTOS)
1.  **JSON Library:** Use `ArduinoJson` (v6+) or similar to parse/generate payloads.
2.  **Stability:** Implement auto-reconnect logic for both WiFi and MQTT.
3.  **Efficiency:** Do not publish data if the values haven't changed significantly (optional, but recommended).
4.  **Security:** For local testing, no authentication is used. Future versions will require username/password.

---

## 🚀 Testing with Backend
1.  Ensure backend is running (`npm run dev`).
2.  Use a tool like `MQTT Explorer` to monitor topics.
3.  Publish a test message to `iot/sensor/data` and check the Dashboard UI.
