# Hướng dẫn MQTT cho Project

## 1. Cài đặt MQTT Broker (Mosquitto)

- Cài đặt Mosquitto trên máy local hoặc server:
  - **Ubuntu:**
    ```sh
    sudo apt update
    sudo apt install mosquitto mosquitto-clients
    ```
  - **Windows:**
    - Tải từ https://mosquitto.org/download/
    - Cài đặt và chạy `mosquitto.exe`
- Mặc định broker sẽ chạy ở `mqtt://localhost:1883`.

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

### a. Test thủ công bằng mosquitto-clients
- Gửi message:
  ```sh
  mosquitto_pub -h localhost -t iot/sensor/data -m '{"temperature":25,"humidity":60}'
  ```
- Nhận message:
  ```sh
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

## 5. Lưu ý
- Khi test unit, không cần broker thật.
- Khi test tích hợp, cần broker thật chạy ở đúng địa chỉ cấu hình.
- Nếu gặp lỗi `Cannot read properties of undefined (reading 'on')`, kiểm tra lại thứ tự mock và require module.

---
Tài liệu tham khảo:
- https://mosquitto.org/
- https://www.npmjs.com/package/mqtt
- https://jestjs.io/docs/mock-functions
