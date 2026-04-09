# Integration Test

## 🎯 Mục tiêu

* Test toàn bộ hệ thống end-to-end

---

## 🔧 Test cần thực hiện

### 1. Data pipeline

Sensor → MQTT → Backend → DB → API → Web

---

### 2. Control pipeline

Web → API → MQTT → ESP32 → Device

---

## 🧪 Test script

### test_pipeline.js

* kiểm tra dữ liệu có đi từ ESP32 → web

### test_control_flow.js

* kiểm tra điều khiển từ web → LED

---

## ⚙️ Run

```bash
node test_pipeline.js
node test_control_flow.js
```

---

## ⚠️ Lưu ý

* Phải chạy toàn bộ system trước khi test
