# Backend Module

## 🎯 Mục tiêu

* Nhận dữ liệu từ MQTT
* Lưu vào database
* Cung cấp API cho frontend

---

## 📦 Thành phần

* `routes/`: API endpoint
* `controllers/`: xử lý logic
* `services/`: DB + MQTT
* `models/`: schema dữ liệu

---

## 🔧 Công việc cần làm

* Kết nối MQTT broker
* Parse dữ liệu từ ESP32
* Lưu vào DB (InfluxDB)
* Tạo API:

  * GET /api/data
  * GET /api/history
  * POST /api/control

---

## 🛠 Công nghệ sử dụng

* Node.js + Express
* MQTT (mosquitto)
* InfluxDB

---

## ⚙️ Build & Run

```bash
npm install
node src/server.js
```

---

## 🧪 Test

### Test API:

```bash
curl http://localhost:3000/api/data
```

### Test MQTT:

* Publish thử message
* Check backend nhận được

---

## ⚠️ Lưu ý

* Không hardcode config → dùng `.env`
* Validate JSON input
