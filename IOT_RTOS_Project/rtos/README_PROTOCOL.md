# RTOS MQTT Protocol

## Publish Telemetry

`vTaskMQTT` publish len topic:

```text
iot/sensor/data
```

JSON payload:

```json
{
  "device_id": "esp32_device",
  "temperature": 25.5,
  "humidity": 60.0,
  "alert_level": 0,
  "timestamp_ms": 170000
}
```

Nguon du lieu:
- `temperature`: DHT22.
- `humidity`: DHT22.
- `alert_level`: do `vTaskDataProcess` tinh theo nguong trong `config.h`.
- `timestamp_ms`: `esp_timer_get_time() / 1000`.
- `device_id`: macro `DEVICE_ID` trong `config.h`.

## Subscribe Control

ESP32 subscribe topic:

```text
iot/device/control
```

Backend publish:

```json
{
  "device_id": "esp32_device",
  "command": "LED_ON",
  "timestamp": 1710000000000
}
```

Lenh chinh:
- `LED_ON`
- `LED_OFF`

Lenh test/noi bo:
- `MUTE_ALARM`
- `TEST_LED`
- `REBOOT`
- `GET_STATUS`
- `LED_RED_ON`, `LED_RED_OFF`
- `LED_YLW_ON`, `LED_YLW_OFF`
- `LED_GRN_ON`, `LED_GRN_OFF`
- `BLINK_RED`, `BLINK_YLW`, `BLINK_GRN`

## Dataflow RTOS

```text
vTaskSensorRead
  -> xSensorQueue
  -> vTaskDataProcess tinh alert_level
  -> g_LatestData
  -> vTaskMQTT publish JSON
```

## Cau Hinh

Trong `config.h`, cap nhat:

```cpp
#define DEVICE_ID "esp32_device"
#define MQTT_SERVER "192.168.1.100"
#define MQTT_TOPIC_PUBLISH "iot/sensor/data"
#define MQTT_TOPIC_COMMAND "iot/device/control"
```

Khong dung `localhost` cho ESP32; dung IP LAN cua may chay Mosquitto/Docker host.
