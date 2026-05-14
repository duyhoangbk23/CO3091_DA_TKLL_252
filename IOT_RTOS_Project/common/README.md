# Common Data Contract

Thu muc nay la nguon tham chieu chung cho RTOS firmware, MQTT, backend, database va web dashboard.

Nguon contract chinh:

- `data_format.json`: payload JSON va topic MQTT.
- `mqtt_topics.h`: topic va cau hinh MQTT dung cho firmware RTOS.

Neu thay doi topic hoac payload, cap nhat dong thoi `data_format.json`, `mqtt_topics.h`, backend `src/config/mqttContract.js` va database schema neu co them/bot cot.

## MQTT topics

| Topic | Huong | Vai tro |
| --- | --- | --- |
| `iot/sensor/data` | ESP32 -> Backend | Telemetry dinh ky tu `vTaskMQTT` |
| `iot/device/status` | ESP32 -> Backend | ACK/status sau khi xu ly lenh |
| `iot/device/control` | Backend -> ESP32 | Lenh dieu khien tu dashboard/API |

## Telemetry: RTOS -> Backend

ESP32 publish len `iot/sensor/data`. Payload hien tai khop voi `common/data_format.json`:

```json
{
  "device_id": "esp32_device",
  "temperature": 28.5,
  "humidity": 65.0,
  "pm25": 15,
  "co2": 450,
  "voc": 350,
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

Field chinh:

| Field | Source hien tai | Note |
| --- | --- | --- |
| `temperature` | SHTC3/RS485 sau khi doi fixed-point x10 sang float | `null` neu thieu |
| `humidity` | SHTC3/RS485 sau khi doi fixed-point x10 sang float | `null` neu thieu |
| `pm25` | PMS7003 UART | `-1` neu thieu |
| `co2` | CO2 RS485/Modbus | `65535` neu thieu theo firmware |
| `voc` | VOC analog / moving average | raw/index tuong doi |
| `alert_level` | `vTaskDataProcess` | `0=OK`, `1=WARN`, `2=CRITICAL` |
| `timestamp` | `esp_timer_get_time()` | Microseconds tu luc boot |
| `sensor_health` | `IaqState`/payload RTOS | Trang thai tung nhom cam bien |
| `alerts` | `IaqState` | Co canh bao tung nguyen nhan |
| `devices` | `IaqState` | Trang thai HEPA/VENT/CARBON/AC/HUMID |

Ghi chu: cac field legacy nhu `air_quality`, DHT22, MQ-135 khong con la contract chinh cua source hien tai.

## Control: Backend -> RTOS

Backend publish len `iot/device/control`. Firmware chap nhan ca lenh legacy dang string va lenh JSON co cau truc.

Lenh co cau truc:

```json
{
  "device_id": "esp32_device",
  "command": "SET_DEVICE",
  "device": "hepa",
  "state": true,
  "command_id": "optional"
}
```

Nhom lenh hien co:

| Command | Vai tro |
| --- | --- |
| `GET_STATUS`, `GET_AUTO` | Lay trang thai hien tai |
| `SET_AUTO` | Bat/tat auto-control |
| `SET_DEVICE` | Dieu khien tung thiet bi khi manual mode |
| `GET_THRESHOLDS` | Yeu cau gui threshold hien tai |
| `SET_THRESHOLDS` | Cap nhat threshold va luu NVS |
| `RESET_THRESHOLDS` | Khoi phuc threshold mac dinh |
| `REBOOT` | Khoi dong lai ESP32 |
| `LED_ON`, `LED_OFF` | Lenh test/manual legacy |
| `HEPA_ON/OFF`, `VENT_ON/OFF`, `CARBON_ON/OFF`, `AC_ON/OFF`, `HUMID_ON/OFF` | Lenh device legacy |

Khi auto-control dang bat, firmware tu choi lenh manual device de tranh override quyet dinh an toan cuc bo.

## Backend API

API chinh hien tai:

| API | Vai tro |
| --- | --- |
| `GET /api/data` | Lay telemetry/latest state tu cache backend |
| `GET /api/history?limit=&hours=` | Lay lich su tu MySQL |
| `GET /api/stats` | Thong ke nhanh tren du lieu lich su |
| `POST /api/control` | Gui lenh legacy/control command |
| `POST /api/control/auto` | Bat/tat auto-control |
| `POST /api/control/device` | Dieu khien tung device |
| `GET /api/control/thresholds` | Gui lenh lay thresholds |
| `POST /api/control/thresholds` | Gui lenh cap nhat thresholds |
| `GET /api/control/history` | Xem lich su lenh trong `control_log` |
| `GET /health` | Health check backend/database |

## Database

Bang chinh:

- `sensor_data`: luu telemetry `device_id`, `temperature`, `humidity`, `pm25`, `co2`, `voc`, `alert_level`, `timestamp`, `created_at`.
- `control_log`: luu lenh backend da gui xuong MQTT.

`timestamp` trong DB luu timestamp tu ESP32. Khi API tra history, backend alias thanh `timestamp_ms` de frontend dung thong nhat.
