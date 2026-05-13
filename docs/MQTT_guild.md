# MQTT Guide

Huong dan chay va test MQTT cho project IoT RTOS.

## Protocol Chuan

Telemetry ESP32 -> Backend:

```powershell
mosquitto_pub -h localhost -t iot/sensor/data -m "{\"device_id\":\"esp32_device\",\"temperature\":25,\"humidity\":60,\"air_quality\":200,\"alert_level\":0,\"timestamp_ms\":123456}"
```

Control Backend -> ESP32:

```powershell
mosquitto_pub -h localhost -t iot/device/control -m "{\"device_id\":\"esp32_device\",\"command\":\"LED_ON\",\"timestamp\":1710000000000}"
```

Debug topic control:

```powershell
mosquitto_sub -h localhost -t iot/device/control -v
```

## Chay Bang Docker

Tai root repo:

```powershell
docker compose up --build
```

Mac dinh:
- MQTT TCP: `localhost:1883`
- MQTT WebSocket: `localhost:9001`
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:8080`

## Chay Mosquitto Rieng Tren Windows

Neu khong dung Docker, cai Mosquitto tu:

```text
https://mosquitto.org/download/
```

Chay broker:

```powershell
mosquitto -v
```

Neu cai Mosquitto thanh Windows service:

```powershell
net start mosquitto
net stop mosquitto
```

## Cau Hinh Backend

File `.env` hoac bien moi truong:

```env
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC_DATA=iot/sensor/data
MQTT_TOPIC_COMMAND=iot/device/control
```

Khi chay trong Docker Compose, backend dung:

```env
MQTT_BROKER=mqtt://mqtt:1883
```

## Cau Hinh ESP32

Trong `IOT_RTOS_Project/rtos/include/config.h`, khong dung `localhost` cho ESP32. Hay dat `MQTT_SERVER` bang IP LAN cua may dang chay broker, vi du:

```cpp
#define MQTT_SERVER "192.168.1.100"
```

Co the override bang PlatformIO build flags neu can.

## Test Nhan Data Tu ESP32

Subscribe telemetry:

```powershell
mosquitto_sub -h localhost -t iot/sensor/data -v
```

Gui telemetry gia lap:

```powershell
mosquitto_pub -h localhost -t iot/sensor/data -m "{\"device_id\":\"esp32_device\",\"temperature\":28.5,\"humidity\":65,\"air_quality\":230,\"alert_level\":0,\"timestamp_ms\":10000}"
```

## Test Lenh Control

Subscribe lenh backend gui:

```powershell
mosquitto_sub -h localhost -t iot/device/control -v
```

Gui lenh truc tiep toi ESP32:

```powershell
mosquitto_pub -h localhost -t iot/device/control -m "{\"device_id\":\"esp32_device\",\"command\":\"LED_OFF\",\"timestamp\":1710000000000}"
```
