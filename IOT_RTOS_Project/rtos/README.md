# RTOS Module

## 🎯 Mục tiêu

* Quản lý task hệ thống
* Xử lý data flow
* Giao tiếp MQTT từ ESP32

---

## 📦 Thành phần

* `tasks/`: các task chính
* `queue/`: truyền dữ liệu giữa task
* `mqtt/`: client MQTT
* `test/`: test logic RTOS

---

## 🔧 Công việc cần làm

* Tạo task:

  * Task_Sensor
  * Task_Process
  * Task_MQTT
  * Task_Control
* Thiết kế queue
* Gửi/nhận MQTT
* Quản lý timing

---

## 🛠 Công nghệ sử dụng

* FreeRTOS
* MQTT client (ESP32)

---

## ⚙️ Build

```bash
idf.py build
idf.py flash monitor
```

---

## 🧪 Test

### Test task:

* Kiểm tra task chạy
* Không bị block

### Test queue:

```c
xQueueSend(...)
xQueueReceive(...)
```

---

## ⚠️ Lưu ý

* Không đọc sensor trực tiếp (qua HAL)
* Không xử lý UI / backend
* Tránh delay blocking
