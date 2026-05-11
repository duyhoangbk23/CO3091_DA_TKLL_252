# Common Contract

Tai lieu nay la contract chung giua ESP32 RTOS, MQTT broker, backend va frontend.

## MQTT Topics

| Topic | Direction | Purpose |
| --- | --- | --- |
| `iot/sensor/data` | ESP32 -> Backend | Gui telemetry dinh ky |
| `iot/device/control` | Backend -> ESP32 | Gui lenh dieu khien |

## Sensor Payload

ESP32 publish JSON len `iot/sensor/data`:

```json
{
  "device_id": "esp32_device",
  "temperature": 30.5,
  "humidity": 70.0,
  "air_quality": 280,
  "alert_level": 1,
  "timestamp_ms": 123456
}
```

Quy uoc:
- `device_id`: ma thiet bi.
- `temperature`: Celsius.
- `humidity`: %RH.
- `air_quality`: gia tri MQ-135/AQI dang integer.
- `alert_level`: `0=OK`, `1=WARN`, `2=CRITICAL`.
- `timestamp_ms`: thoi gian tinh bang milliseconds tu luc ESP32 boot.

Backend van chap nhan field cu `timestamp`, nhung firmware moi nen dung `timestamp_ms`.

## Control Payload

Backend publish JSON len `iot/device/control`:

```json
{
  "device_id": "esp32_device",
  "command": "LED_ON",
  "timestamp": 1710000000000
}
```

Lenh tu UI hien tai:
- `ON` -> backend publish `LED_ON`.
- `OFF` -> backend publish `LED_OFF`.

Firmware van giu fallback de test nhanh bang raw payload nhu `LED_ON`, `LED_OFF`, `GET_STATUS`.

## HTTP API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/data` | Lay data moi nhat tu RAM backend |
| `GET` | `/api/history?limit=100&hours=24` | Lay lich su tu MySQL |
| `GET` | `/api/stats?hours=24` | Lay thong ke |
| `POST` | `/api/control` | Gui lenh dieu khien |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness |

Vi du control API:

```json
{
  "device_id": "esp32_device",
  "command": "ON"
}
```
