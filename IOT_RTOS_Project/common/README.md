# Common Data Contract

Contract nay la nguon tham chieu chung cho RTOS, MQTT, backend, database va web.

## RTOS -> IoT Backend

ESP32 publish telemetry len MQTT topic:

```text
iot/sensor/data
```

Payload bat buoc:

```json
{
  "device_id": "esp32_device",
  "temperature": 28.5,
  "humidity": 65.0,
  "air_quality": 320,
  "alert_level": 0,
  "timestamp_ms": 123456
}
```

Field:

| Field | Type | Source | Note |
| --- | --- | --- | --- |
| `device_id` | string | `DEVICE_ID` trong `config.h` | Mac dinh `esp32_device` |
| `temperature` | number | DHT22 | Celsius |
| `humidity` | number | DHT22 | `%RH` |
| `air_quality` | integer | MQ-135 ADC | Raw ADC value |
| `alert_level` | integer | `vTaskDataProcess` | `0=OK`, `1=WARN`, `2=CRITICAL` |
| `timestamp_ms` | integer | `esp_timer_get_time() / 1000` | Milliseconds tu luc ESP32 boot |

Trong RTOS, struct `SensorData_t` khong chua `device_id`; `device_id` duoc them khi `vTaskMQTT` serialize JSON.

## Backend -> RTOS

Backend publish command len MQTT topic:

```text
iot/device/control
```

Payload:

```json
{
  "device_id": "esp32_device",
  "command": "LED_ON",
  "timestamp": 1710000000000
}
```

Lenh hien tai:

| API command | MQTT command |
| --- | --- |
| `ON` | `LED_ON` |
| `OFF` | `LED_OFF` |

Firmware cung chap nhan raw command de test truc tiep bang MQTT client: `LED_ON`, `LED_OFF`, `GET_STATUS`, `REBOOT`, `MUTE_ALARM`.

## Backend API

`GET /api/data` tra ve data moi nhat:

```json
{
  "success": true,
  "data": {
    "device_id": "esp32_device",
    "temperature": 28.5,
    "humidity": 65.0,
    "air_quality": 320,
    "alert_level": 0,
    "timestamp_ms": 123456,
    "received_at": "2026-05-11T08:00:00.000Z",
    "status": "online"
  },
  "timestamp": "2026-05-11T08:00:00.000Z"
}
```

Luu y:
- `timestamp_ms` la thoi gian cua ESP32 tinh tu luc boot.
- `received_at` va response `timestamp` la thoi gian cua backend/server.

## Database

Bang `sensor_data` luu:

```text
device_id, temperature, humidity, air_quality, alert_level, timestamp, created_at
```

Cot DB `timestamp` luu gia tri `timestamp_ms` cua ESP32. Khi API tra history, backend alias cot nay thanh `timestamp_ms`.

## Web

Dashboard va Analytics phai hien thi du 6 field telemetry:

```text
device_id, temperature, humidity, air_quality, alert_level, timestamp_ms
```
