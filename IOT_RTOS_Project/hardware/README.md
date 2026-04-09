# Hardware Module

## 🎯 Mục tiêu

* Giao tiếp trực tiếp với phần cứng (sensor, LED, buzzer)
* Cung cấp API (HAL) cho RTOS sử dụng

---

## 📦 Thành phần

* `drivers/`: driver mức thấp (DHT, LED…)
* `hal/`: abstraction layer (interface cho RTOS)
* `config/`: cấu hình chân (GPIO)
* `test/`: test phần cứng độc lập

---

## 🔧 Công việc cần làm

* Viết driver đọc sensor (DHT, etc.)
* Viết driver điều khiển thiết bị (LED, buzzer)
* Tạo interface trong `hal/`
* Đảm bảo dữ liệu đọc ổn định

---

## 🛠 Công nghệ sử dụng

* C / ESP-IDF hoặc Arduino
* GPIO, ADC

---

## ⚙️ Build

* ESP-IDF:

```bash
idf.py build
idf.py flash
```

* Arduino:
  Upload qua Arduino IDE

---

## 🧪 Test

### Test sensor:

```c
printf("Temp: %f\n", readTemperature());
```

### Test LED:

```c
setLED(1);
delay(1000);
setLED(0);
```

---

## ⚠️ Lưu ý

* Không viết logic RTOS ở đây
* Không dùng MQTT trực tiếp
