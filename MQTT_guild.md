# Hướng dẫn MQTT cho Project

## 1. Cài đặt MQTT Broker (Mosquitto) trên Windows

- Truy cập https://mosquitto.org/download/ và tải bản Windows Installer (ví dụ: `mosquitto-2.x.x-install-windows-x64.exe`).
- Cài đặt bình thường, tick chọn "Service" nếu muốn Mosquitto chạy như một dịch vụ Windows (khuyến nghị tick cả phần client tools).
- Sau khi cài đặt xong:
  - Để chạy Mosquitto broker:
    - Mở Command Prompt (cmd) hoặc PowerShell.
    - Chạy lệnh:
      ```powershell
      mosquitto -v -c "C:\Program Files\mosquitto\mosquitto.conf"
      ```
    - Nếu đã cài đặt service, có thể bật/tắt bằng:
      ```powershell
      net start mosquitto
      net stop mosquitto
      ```
- Mặc định broker sẽ chạy ở `mqtt://localhost:1883`.
- Để test nhanh, có thể mở 2 cửa sổ cmd:
  - Một cửa sổ chạy broker: `mosquitto -v`
  - Một cửa sổ khác dùng lệnh pub/sub như bên dưới.

## 2. Cấu hình kết nối MQTT trong project

- File cấu hình: `.env` hoặc biến môi trường
  ```env
  MQTT_BROKER=mqtt://localhost:1883
  ```
- Trong code (ví dụ ở `src/mqtt/mqttClient.js`):
  ```js
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
  const client = mqtt.connect(brokerUrl);
  ```

## 3. Chạy backend với MQTT

- Đảm bảo broker đã chạy (`mosquitto` đang bật)
- Chạy backend:
  ```sh
  cd IOT_RTOS_Project/iot_backend/backend
  npm install
  npm start
  ```

## 4. Test với MQTT

### a. Test thủ công bằng mosquitto-clients (Windows)
- Gửi message:
  ```powershell
  mosquitto_pub -h localhost -t iot/sensor/data -m "{\"temperature\":25,\"humidity\":60}"
  ```
- Nhận message:
  ```powershell
  mosquitto_sub -h localhost -t iot/device/control
  ```

### b. Test tự động với Jest
- Các test mock module `mqtt` để không cần broker thật.
- Đảm bảo trong test:
  - Mock đúng `mqtt.connect` trả về fake client có hàm `on`, `subscribe`, `publish`.
  - Reset module và mock trước khi require module cần test.
- Ví dụ:
  ```js
  jest.mock('mqtt');
  const mqtt = require('mqtt');
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  test('...', () => {
    const fakeClient = makeFakeClient();
    mqtt.connect.mockReturnValue(fakeClient);
    const mqttClient = require('../../src/mqtt/mqttClient');
    // ...
  });
  ```

## 5. Lưu ý cho Windows
- Khi test unit, không cần broker thật.
- Khi test tích hợp, cần broker thật chạy ở đúng địa chỉ cấu hình (`localhost:1883`).
- Nếu gặp lỗi `Cannot read properties of undefined (reading 'on')`, kiểm tra lại thứ tự mock và require module.
- Nếu lệnh `mosquitto_pub` hoặc `mosquitto_sub` không nhận diện được, hãy thêm thư mục cài đặt Mosquitto (mặc định: `C:\Program Files\mosquitto`) vào biến môi trường PATH hoặc chạy lệnh với đường dẫn đầy đủ, ví dụ:
  ```powershell
  "C:\Program Files\mosquitto\mosquitto_pub.exe" -h localhost -t iot/sensor/data -m "{\"temperature\":25,\"humidity\":60}"
  ```

---
Tài liệu tham khảo:
- https://mosquitto.org/
- https://www.npmjs.com/package/mqtt
- https://jestjs.io/docs/mock-functions
