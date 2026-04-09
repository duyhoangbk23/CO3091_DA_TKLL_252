# Common Contract

## 🎯 Mục tiêu

* Định nghĩa chuẩn giao tiếp giữa các module

---

## 📦 Nội dung

### MQTT topics

* iot/sensor/data
* iot/device/control

---

### Data format

```json
{
  "device_id": "esp32_1",
  "temperature": 30,
  "humidity": 70,
  "timestamp": 123456
}
```

---

### API

* GET /api/data
* GET /api/history
* POST /api/control

---

## ⚠️ Lưu ý

* KHÔNG thay đổi format nếu chưa thống nhất
