# RTOS MQTT Protocol

Tai lieu nay mo ta protocol MQTT dung boi `rtos/src/task_mqtt.cpp` va `rtos/src/task_control.cpp`. Contract chi tiet nam trong `../common/data_format.json`.

## Publish telemetry

`vTaskMQTT` publish len:

```text
iot/sensor/data
```

Payload mau:

```json
{
  "device_id": "esp32_device",
  "temperature": 25.5,
  "humidity": 60.0,
  "pm25": 12,
  "co2": 480,
  "voc": 320,
  "alert_level": 0,
  "timestamp": 123456789,
  "uptime_ms": 123456,
  "auto_control_enabled": true,
  "config_version": 1,
  "sensor_health": {
    "co2": "OK",
    "pm": "OK",
    "voc": "OK",
    "temp": "OK",
    "rh": "OK"
  },
  "alerts": {
    "co2": false,
    "pm": false,
    "voc": false,
    "temp": false,
    "rh": false
  },
  "devices": {
    "hepa": false,
    "vent": false,
    "carbon": false,
    "ac": false,
    "humid": false
  }
}
```

Nguon du lieu:

- `temperature`, `humidity`: SHTC3/RS485, fixed-point x10 doi sang float.
- `pm25`: PMS7003 UART, `-1` neu thieu.
- `co2`: CO2 RS485/Modbus, `65535` neu thieu.
- `voc`: VOC analog/moving average.
- `alert_level`: `vTaskDataProcess` tinh tu `IaqState`.
- `timestamp`: `esp_timer_get_time()` theo microseconds.

## Subscribe control

ESP32 subscribe:

```text
iot/device/control
```

Lenh co cau truc:

```json
{
  "device_id": "esp32_device",
  "command": "SET_AUTO",
  "enabled": true,
  "command_id": "optional"
}
```

Hoac:

```json
{
  "device_id": "esp32_device",
  "command": "SET_DEVICE",
  "device": "hepa",
  "state": true,
  "command_id": "optional"
}
```

Lenh chinh:

- `GET_STATUS`, `GET_AUTO`
- `SET_AUTO`
- `SET_DEVICE`
- `GET_THRESHOLDS`
- `SET_THRESHOLDS`
- `RESET_THRESHOLDS`
- `REBOOT`

Lenh legacy/test van duoc chap nhan:

- `LED_ON`, `LED_OFF`
- `HEPA_ON/OFF`, `VENT_ON/OFF`, `CARBON_ON/OFF`, `AC_ON/OFF`, `HUMID_ON/OFF`

## Publish device status / ACK

Sau khi xu ly lenh, firmware publish ACK/status len:

```text
iot/device/status
```

Payload co cac field: `device_id`, `command`, `command_id`, `status`, `message`, `devices`, `auto_control_enabled`, `config_version`, va co the kem `thresholds`.

## Dataflow RTOS

```text
SensorHub
  -> vTaskSensorRead
  -> xSensorQueue
  -> vTaskDataProcess / IaqEvaluator
  -> g_LatestData + g_iaq
  -> vTaskMQTT publish telemetry

Backend / Dashboard
  -> iot/device/control
  -> vTaskMQTT callback
  -> xControlQueue
  -> vTaskControl
  -> IaqController / Preferences / ACK
```

## Cau hinh

Uu tien cau hinh local trong `include/local_config.h`:

```cpp
#define WIFI_SSID "MyNetwork"
#define WIFI_PASS "mypassword"
#define MQTT_BROKER_HOST "192.168.1.100"
#define MQTT_BROKER_PORT 1883
#define DEVICE_ID "esp32_device"
```

Khong dung `localhost` cho ESP32; dung IP LAN cua may chay Mosquitto/Docker host.
