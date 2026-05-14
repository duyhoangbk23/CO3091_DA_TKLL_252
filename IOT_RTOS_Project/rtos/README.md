# RTOS Module

Firmware RTOS chay tren ESP32 bang PlatformIO/Arduino framework. Module nay tich hop doc cam bien, xu ly IAQ, dieu khien LED/thiet bi mo phong va MQTT.

## Thanh phan hien co

```text
rtos/
|-- platformio.ini
|-- include/
|   |-- board_config.h
|   |-- config.h
|   |-- local_config.example.h
|   |-- MqttCommand.h
|   `-- tasks.h
|-- src/
|   |-- main.cpp
|   |-- global.cpp
|   |-- task_sensor.cpp
|   |-- data_process.cpp
|   |-- task_alert.cpp
|   |-- task_control.cpp
|   `-- task_mqtt.cpp
|-- lib/iaq_hardware/src/
`-- test/
```

## Task model

| Task | Vai tro | Giao tiep |
| --- | --- | --- |
| `vTaskSensorRead` | Doc PMS7003, RS485/Modbus, VOC moi 2s | Ghi `SnapshotStore`, gui `SensorData_t` vao `xSensorQueue` |
| `vTaskDataProcess` | Chuyen doi du lieu, goi `IaqEvaluator`, tinh `alert_level` | Doc `xSensorQueue`, cap nhat `g_LatestData`, `g_iaq` qua `xDataMutex` |
| `vTaskAlert` | Ap dung trang thai IAQ ra 10 LED | Dung `xAlertSem` va `xDataMutex` |
| `vTaskMQTT` | Ket noi Wi-Fi/MQTT, publish telemetry, subscribe command | Dung `mqtt_topics.h`, doc `g_LatestData` |
| `vTaskControl` | Xu ly lenh dashboard/MQTT | Doc `xControlQueue`, cap nhat auto/manual mode va thresholds |

Tai nguyen RTOS duoc khoi tao trong `init_system_resources()`:

- `xSensorQueue`
- `xControlQueue`
- `xDataMutex`
- `xAlertSem`

## Local configuration

Truoc khi flash phan cung that, copy:

```text
include/local_config.example.h -> include/local_config.h
```

Sau do cau hinh Wi-Fi, MQTT broker va `DEVICE_ID`. File `local_config.h` da duoc ignore de khong commit credential.

## MQTT contract

Firmware dung topic tu `../common/mqtt_topics.h`, khop voi `../common/data_format.json` va backend `src/config/mqttContract.js`.

Topic chinh:

- Publish telemetry: `iot/sensor/data`
- Publish ACK/status: `iot/device/status`
- Subscribe command: `iot/device/control`

Xem them `README_PROTOCOL.md`.

## Build va flash

Tu thu muc `IOT_RTOS_Project/rtos`:

```powershell
platformio run
platformio run --target upload
platformio device monitor -b 115200
```

Hoac dung script tu root `IOT_RTOS_Project` neu workflow local da cau hinh:

```powershell
scripts\build-firmware.bat
```

## Test

Native test environment:

```powershell
platformio test -e native
```

Backend co test mo phong MQTT/RTOS o:

```text
iot_backend/backend/tests/integration/rtos_backend.test.js
```

## Luu y thiet ke

- Khong dung `localhost` lam MQTT broker cho ESP32; dung IP LAN cua may chay Docker/Mosquitto.
- Neu auto-control dang bat, firmware tu choi lenh manual device de tranh override quyet dinh IAQ cuc bo.
- VOC hien la raw/index tuong doi, can hieu chuan neu muon ket luan theo chuan VOC thuc te.
