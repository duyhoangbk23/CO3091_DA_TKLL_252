# MQTT Protocol for RTOS

Tai lieu nay dinh nghia protocol ESP32 RTOS phai tuan theo de tuong thich voi backend va dashboard.

## Topics

| Topic | Direction | Purpose |
| --- | --- | --- |
| `iot/sensor/data` | ESP32 -> Backend | Telemetry dinh ky |
| `iot/device/control` | Backend -> ESP32 | Lenh dieu khien |

## Publish Sensor Data

ESP32 publish JSON len `iot/sensor/data` moi 1-10 giay.

```json
{
  "device_id": "esp32_device",
  "temperature": 25.5,
  "humidity": 60.0,
  "air_quality": 200,
  "alert_level": 0,
  "timestamp_ms": 170000
}
```

Field:
- `device_id`: ma thiet bi.
- `temperature`: nhiet do Celsius.
- `humidity`: do am %RH.
- `air_quality`: gia tri MQ-135/AQI dang integer.
- `alert_level`: `0=OK`, `1=WARN`, `2=CRITICAL`.
- `timestamp_ms`: milliseconds ke tu khi ESP32 boot.

## Subscribe Controls

ESP32 subscribe `iot/device/control`.

Backend se publish:

```json
{
  "device_id": "esp32_device",
  "command": "LED_ON",
  "timestamp": 1710000000000
}
```

Lenh hien tai:
- `LED_ON`
- `LED_OFF`

Firmware cung co the xu ly cac lenh noi bo dang raw string de test bang MQTT client:
- `MUTE_ALARM`
- `TEST_LED`
- `REBOOT`
- `GET_STATUS`
- `LED_RED_ON`, `LED_RED_OFF`
- `LED_YLW_ON`, `LED_YLW_OFF`
- `LED_GRN_ON`, `LED_GRN_OFF`
- `BLINK_RED`, `BLINK_YLW`, `BLINK_GRN`

## RTOS Requirements

- Dung ArduinoJson de parse JSON control.
- Co auto-reconnect WiFi va MQTT.
- Khong dung `localhost` lam MQTT host tren ESP32; dung IP LAN cua may chay Mosquitto/Docker host.
- Neu muon override cau hinh khi build, dung PlatformIO build flags cho `WIFI_SSID`, `WIFI_PASS`, `MQTT_SERVER`.
