# Hướng dẫn demo và test end-to-end (phần cứng có sẵn, chưa nạp firmware — mã nguồn có sẵn, dịch vụ chưa bật)

Tài liệu này mô tả **thứ tự làm việc** từ máy tính phát triển đến thiết bị ESP32, trong bối cảnh: board và cảm biến đã lắp nhưng **chưa nạp chương trình**; repo đã clone nhưng **MySQL, MQTT broker, backend Node chưa chạy**.

> **Gợi ý:** Nếu bạn muốn tên file chuẩn tiếng Anh, có thể đổi thành `test_guide.md`. Nội dung hướng dẫn giống nhau.

---

## 1. Chuẩn bị trên máy tính (Windows)

Cài đặt hoặc kiểm tra các thành phần sau:

| Thành phần | Mục đích |
|------------|----------|
| **Node.js** (LTS) | Chạy backend `iot_backend/backend` |
| **MySQL** (8.x) | Lưu `sensor_data`, `control_log` |
| **MQTT broker** (Mosquitto hoặc tương đương) | Trung gian giữa ESP32 và backend |
| **PlatformIO** (CLI hoặc extension VS Code) | Build và nạp firmware ESP32 |
| **Driver USB–UART** cho board ESP32 | Nạp code và Serial Monitor |

Kiểm nhanh trong PowerShell:

```powershell
node --version
npm --version
mysql --version
pio --version
```

---

## 2. Lấy địa chỉ IP máy tính trên mạng LAN

ESP32 phải trỏ MQTT broker tới **IP thật** của máy chạy Mosquitto (thường trùng máy chạy backend), **không dùng** `localhost` trên firmware.

Trên Windows:

```powershell
ipconfig
```

Ghi lại **IPv4** của card đang dùng ('192.168.110.148'). Giá trị này dùng cho:

- `MQTT_SERVER` trong `IOT_RTOS_Project/common/mqtt_topics.h` (sau bước chỉnh firmware).
- Xác nhận ESP32 và PC **cùng subnet WiFi** (cùng router, không client isolation).

---

## 3. Khởi tạo cơ sở dữ liệu MySQL

1. Bật dịch vụ MySQL (Services → MySQL hoặc XAMPP/WAMP tùy môi trường).
2. Đăng nhập quyền root (mật khẩu tùy máy bạn), chạy script schema:

```powershell
cd "d:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252\IOT_RTOS_Project\iot_backend\database"
mysql -u root -p < schema.sql
```

3. Tạo user khớp file môi trường (ví dụ theo `.env.example`): tạo user `iot_user`, cấp quyền trên `iot_db` (chỉnh mật khẩu cho đúng bảo mật của bạn):

```sql
CREATE USER IF NOT EXISTS 'iot_user'@'localhost' IDENTIFIED BY 'iot_password';
GRANT ALL PRIVILEGES ON iot_db.* TO 'iot_user'@'localhost';
FLUSH PRIVILEGES;
```

4. Kiểm tra:

```sql
USE iot_db;
SHOW TABLES;
```

Kỳ vọng có bảng `sensor_data`, `control_log`.

---

## 4. Cấu hình và bật MQTT broker (Mosquitto)

**Mục tiêu:** broker lắng nghe cổng **1883**, backend và ESP32 cùng kết nối tới đây.

- **Cài Mosquitto for Windows** (Eclipse Mosquitto) hoặc chạy broker trong Docker/WSL nếu bạn quen.
- Đảm bảo firewall Windows cho phép **cổng 1883** (inbound) nếu ESP32 kết nối từ WiFi tới PC.

Kiểm tra nhanh (sau khi broker chạy), trên PC:

```powershell
Test-NetConnection -ComputerName localhost -Port 1883
```

Trạng thái `TcpTestSucceeded : True` nghĩa là broker đã lắng nghe.

---

## 5. Cấu hình backend Node (`.env`)

1. Vào thư mục backend:

```powershell
cd "d:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252\IOT_RTOS_Project\iot_backend\backend"
```

2. Sao chép file môi trường mẫu:

```powershell
copy .env.example .env
```

3. Mở `.env` và chỉnh tối thiểu các dòng sau cho khớp MySQL và MQTT thực tế:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `MQTT_BROKER` — nếu broker chạy trên cùng PC: `mqtt://localhost:1883`
- `CORS_ORIGIN` — nếu mở frontend bằng `file://` thì giữ `http://localhost:8080` hoặc đúng origin bạn dùng khi serve tĩnh.

4. Cài dependency và chạy server:

```powershell
npm install
npm start
```

**Dấu hiệu thành công trong log:**

- Kết nối MySQL thành công (hoặc cảnh báo rõ nếu sai account).
- Dòng kiểu đã kết nối MQTT broker và đã subscribe topic `iot/sensor/data`, `iot/device/status`.
- Server lắng nghe `http://localhost:3000`.

Giữ cửa sổ terminal này **mở** suốt phiên demo.

---

## 6. Kiểm tra API trước khi có thiết bị

Mở PowerShell thứ hai:

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/api/data
```

- `/health` trả JSON trạng thái là backend đã chạy.
- `/api/data` ban đầu có thể là giá trị mặc định / offline cho tới khi có dữ liệu MQTT thật.

Gửi thử lệnh điều khiển (sau khi ESP32 đã chạy và subscribe topic điều khiển):

```powershell
curl -X POST http://localhost:3000/api/control -H "Content-Type: application/json" -d "{\"device_id\":\"esp32_device\",\"command\":\"ON\"}"
```

`device_id` phải **trùng** với macro `DEVICE_ID` trên firmware (trong repo hiện gắn với `hardware/main/Pins.h`).

---

## 7. Chỉnh firmware RTOS (WiFi, broker, device_id)

Trước khi build và nạp:

1. **`IOT_RTOS_Project/common/mqtt_topics.h`**
   - `WIFI_SSID`, `WIFI_PASS`: WiFi thật mà ESP32 dùng (cùng mạng với PC chạy broker).
   - `MQTT_SERVER`: đặt **IPv4** đã ghi ở mục 2 (máy chạy Mosquitto).
   - Topic giữ mặc định `iot/sensor/data`, `iot/device/control`, … trừ khi bạn đổi đồng bộ cả `data_format.json` và backend.

2. **`IOT_RTOS_Project/hardware/main/Pins.h`**
   - `DEVICE_ID` phải trùng với option trên web (mặc định `esp32_device` trong `control.html`).

3. **PlatformIO — thư mục mã nguồn firmware**

   File `platformio.ini` nằm ở `IOT_RTOS_Project`. Nếu lệnh `pio run` báo không tìm thấy project source, thêm vào section `[env:esp32dev]`:

   ```ini
   src_dir = rtos/src
   ```

   Sau đó build:

   ```powershell
   cd "d:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252\IOT_RTOS_Project"
   pio run
   ```

4. **Nạp firmware:** kết nối USB, chọn đúng COM, rồi:

   ```powershell
   pio run -t upload
   pio device monitor
   ```

**Trên Serial Monitor**, quan sát: WiFi kết nối, MQTT reconnect thành công, định kỳ có log publish (khoảng 10 giây một lần theo task MQTT).

---

## 8. Mở giao diện web (dashboard / điều khiển)

Frontend nằm tại `IOT_RTOS_Project/iot_backend/frontend/public/`.

- Cách đơn giản: mở trực tiếp file `index.html`, `control.html` bằng trình duyệt (`file://`).
- Module `js/services/api.js` đã gán API tới `http://localhost:3000` khi trang mở bằng `file://`, nên **backend phải chạy** trước.

Thứ tự khuyến nghị khi demo:

1. MySQL → Mosquitto → `npm start` (backend).
2. Mở `index.html`, xác nhận không lỗi CORS và `/api/data` có dữ liệu sau vài chu kỳ MQTT.
3. Mở `control.html`, chọn đúng **Device ID**, gửi **ON** / **OFF**, quan sát Serial và LED (theo logic `task_control.cpp`).

---

## 9. Kịch bản demo end-to-end (checklist)

Lần lượt đánh dấu khi đạt:

1. [ ] MySQL có `iot_db` và hai bảng `sensor_data`, `control_log`.
2. [ ] Mosquitto lắng nghe cổng 1883; PC và ESP32 cùng mạng.
3. [ ] Backend chạy không lỗi kết nối DB và MQTT.
4. [ ] ESP32 nạp xong, Serial báo WiFi + MQTT OK.
5. [ ] Gọi `GET http://localhost:3000/api/data` thấy nhiệt độ / độ ẩm / trạng thái cập nhật (sau khi có telemetry).
6. [ ] Trong MySQL: `SELECT * FROM sensor_data ORDER BY id DESC LIMIT 5;` có dòng mới theo thời gian.
7. [ ] `POST /api/control` với `ON`/`OFF` → backend publish MQTT → Serial ESP32 in nhận lệnh; `control_log` có bản ghi.

---

## 10. Gỡ lỗi thường gặp

| Hiện tượng | Hướng xử lý |
|-------------|-------------|
| ESP32 MQTT fail liên tục | Kiểm tra `MQTT_SERVER` là IP LAN của PC; broker đã chạy; firewall mở 1883; WiFi không cách ly client. |
| Backend “MySQL connection failed” | Kiểm tra `.env`, user/password, MySQL service, đã chạy `schema.sql`. |
| Backend không nhận MQTT | `MQTT_BROKER` trong `.env` trùng broker thật; topic không đổi lệch so với `common/data_format.json`. |
| `/api/control` 400 hoặc thiết bị không phản hồi | `device_id` trong JSON phải khớp `DEVICE_ID` firmware; ESP32 phải đã `subscribe` topic điều khiển. |
| Frontend “Failed to fetch” | Backend chưa chạy hoặc sai cổng; thử `curl http://localhost:3000/health`. |
| `pio run` không thấy `main.cpp` | Thêm `src_dir = rtos/src` vào `platformio.ini` như mục 7. |

---

## 11. Tham chiếu nhanh đường dẫn trong repo

| Thành phần | Đường dẫn |
|------------|-----------|
| Schema DB | `iot_backend/database/schema.sql` |
| Backend | `iot_backend/backend` (`npm start`, file `.env`) |
| Hợp đồng topic / payload | `common/data_format.json` |
| Topic + WiFi + IP broker (RTOS) | `common/mqtt_topics.h` |
| ID thiết bị | `hardware/main/Pins.h` (`DEVICE_ID`) |
| Firmware RTOS | `rtos/src/*.cpp` |
| Frontend tĩnh | `iot_backend/frontend/public/` |

Khi các mục trong checklist đều pass, bạn đã hoàn tất **thiết lập từ đầu** và có thể demo bài trước hội đồng hoặc team một cách có lặp lại được.
