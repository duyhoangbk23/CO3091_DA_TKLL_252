# Mẫu dữ liệu thử nghiệm cho test IoT & RTOS

## 1. Mẫu dữ liệu sensor (gửi lên MQTT topic `iot/sensor/data`)
```json
{
  "temperature": 28.5,
  "humidity": 65,
  "air_quality": 320,
  "alert_level": 0,
  "timestamp": 1683830400000
}
```

## 2. Mẫu dữ liệu điều khiển (gửi lên MQTT topic `iot/device/control`)
```json
{
  "led": "ON",
  "fan": "OFF",
  "buzzer": "ON"
}
```

## 3. Mẫu dữ liệu sensor cho RTOS test (giả lập gửi từ thiết bị)
```c
// C struct giả lập
struct SensorData {
    float temperature; // 28.5
    float humidity;    // 65
    int light;         // 320
    int pressure;      // 1012
    char timestamp[25];// "2026-05-11T10:00:00Z"
};

struct SensorData test_data = {
    28.5, 65, 320, 1012, "2026-05-11T10:00:00Z"
};
```

## 4. Mẫu dữ liệu điều khiển cho RTOS test (giả lập nhận lệnh)
```c
// C struct giả lập
struct ControlData {
    char led[4];    // "ON"
    char fan[4];    // "OFF"
    char buzzer[4]; // "ON"
};

struct ControlData test_control = {
    "ON", "OFF", "ON"
};
```

## 5. Hướng dẫn sử dụng mẫu thử
- Dùng lệnh `mosquitto_pub` để gửi mẫu sensor lên broker:
  ```sh
  mosquitto_pub -h localhost -t iot/sensor/data -m '{"temperature":28.5,"humidity":65,"light":320,"pressure":1012,"timestamp":"2026-05-11T10:00:00Z"}'
  ```
- Dùng lệnh `mosquitto_pub` để gửi mẫu điều khiển:
  ```sh
  mosquitto_pub -h localhost -t iot/device/control -m '{"led":"ON","fan":"OFF","buzzer":"ON"}'
  ```
- Trong RTOS, có thể hardcode struct test_data/test_control để kiểm thử luồng xử lý.

---
Bạn có thể copy các mẫu này vào test tự động hoặc thủ công cho cả backend lẫn firmware RTOS.