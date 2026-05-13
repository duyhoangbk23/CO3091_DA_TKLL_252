# WiFi Connection Test Guide

## Giới thiệu
Bài test này kiểm tra kết nối ESP32 với mạng WiFi. Test bao gồm:
- Quét các mạng WiFi có sẵn
- Kết nối đến mạng WiFi được chỉ định
- Kiểm tra chất lượng tín hiệu
- Thử ping tới máy chủ ngoài internet (8.8.8.8)

## Các bước thực hiện

### 1. Cấu hình WiFi Credentials
Mở file `testWiFi.ino` và cập nhật:
```cpp
const char* WIFI_SSID = "Z Robotics";        // Thay bằng tên WiFi của bạn
const char* WIFI_PASS = "28102023";    // Thay bằng mật khẩu WiFi
```

### 2. Biên dịch và Upload
Trong VS Code:
1. Nhấn **Ctrl+Shift+B** hoặc chọn **Terminal → Run Build Task**
2. Chọn **esp32dev** environment
3. Đợi biên dịch hoàn thành

Hoặc dùng terminal:
```bash
cd "d:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252\IOT_RTOS_Project"
platformio run --environment esp32dev
platformio run --target upload --environment esp32dev
```

### 3. Monitor Serial Output
Mở Serial Monitor:
- Baud rate: **115200**
- Nhấn **Ctrl+Alt+M** hoặc chọn **PlatformIO → Serial Monitor**

## Output Expected

### Khi thành công:
```
========================================
   WiFi Connection Test for ESP32
========================================

--- ESP32 System Information ---
Chip Model: ESP32
Chip Revision: 1
Cores: 2
Free Heap: 186456 bytes
MAC Address: 00:11:22:33:44:55
Flash Chip Size: 4194304 bytes

--- Bắt đầu Scan WiFi Networks ---
Tìm thấy 5 WiFi network:
  1. MyNetwork (RSSI: -45 dBm, Channel: 6, Security: WPA2_PSK)
  2. NeighborWiFi (RSSI: -62 dBm, Channel: 11, Security: WPA2_PSK)
  ...

--- Thử kết nối WiFi ---
SSID: MyNetwork
Password: mypassword

Kết nối WiFi...
..
========================================
   ✓ CONNECTED TO WiFi SUCCESSFULLY!
========================================
SSID: MyNetwork
IP Address: 192.168.1.100
Gateway: 192.168.1.1
Subnet Mask: 255.255.255.0
DNS 1: 192.168.1.1
DNS 2: 0.0.0.0
Signal Strength (RSSI): -45 dBm
Channel: 6
========================================

[2000 ms] --- WiFi Connection Status Check ---
Status: Connected
IP Address: 192.168.1.100
Signal Strength (RSSI): -45 dBm
Signal Quality: Good (-50 to -60 dBm)
Ping test (8.8.8.8): ✓ Success
```

### Khi thất bại:
```
[ERROR] Kết nối WiFi thất bại!
[WiFi Error Code: WL_NO_SSID_AVAIL - SSID không tìm thấy]
```

## Hiểu Signal Strength (RSSI)

| RSSI | Chất lượng | Mô tả |
|------|-----------|-------|
| > -50 dBm | Excellent | Rất tốt, tín hiệu mạnh |
| -50 to -60 | Good | Tốt, đủ mạnh |
| -60 to -70 | Fair | Trung bình, có thể có lag |
| < -70 dBm | Weak | Yếu, dễ mất kết nối |

## Troubleshooting

### Lỗi: "SSID không tìm thấy"
- Kiểm tra tên WiFi (case-sensitive)
- Chắc chắn rằng WiFi router đang bật
- Thử quét lại: upload test, xem danh sách các mạng

### Lỗi: "Kết nối thất bại"
- Kiểm tra mật khẩu WiFi
- Thử thay mật khẩu trực tiếp trong code
- Kiểm tra xem router có hỗ trợ thiết bị của bạn không

### Tín hiệu yếu
- Đặt ESP32 gần router
- Kiểm tra các vật cản (tường, kim loại)
- Thử đặt router ở vị trí khác

### Không thể ping
- Kiểm tra kết nối internet của router
- Thử kết nối tới website khác (ví dụ: 1.1.1.1)
- Kiểm tra DNS settings

## Tiếp theo

Khi WiFi test thành công, bạn có thể:
1. Cập nhật credentials vào `rtos/include/config.h`
2. Build dự án chính
3. Test kết nối MQTT

```cpp
// rtos/include/config.h
#define WIFI_SSID "MyNetwork"
#define WIFI_PASS "mypassword"
#define MQTT_SERVER "your.mqtt.broker"
#define MQTT_PORT 1883
#define DEVICE_ID "esp32_1"
```

## Lệnh Manual Console (Optional)

Nếu muốn thử các lệnh khác:
```cpp
// Trong setup(), bạn có thể thêm:
WiFi.begin("SSID", "PASSWORD");
Serial.println(WiFi.localIP());  // In địa chỉ IP
Serial.println(WiFi.RSSI());     // In tín hiệu
```
