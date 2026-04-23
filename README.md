# CO3091\_DA\_TKLL\_252

Môn: Đồ án thiết kế luận lí

Đề tài: Thiết kế hệ thống tích hợp IoT sử dụng hệ điều hành thời gian thực (RTOS).

Chủ đề: Trạm quan trắc môi trường IoT Thu thập nhiệt độ/độ ẩm/chất lượng không khí, hiển thị LCD, gửi MQTT lên dashboard. Có cảnh báo ngưỡng real-time.
Người thực hiện:

1. Hoàng Anh Duy | IOT + Backend + WEB
2. Hồ Công Danh  | RTOS
3. Cao Quang Đôn | Hardware 



Flow dữ liệu:

Từ ESP32 lên web: Sensor → ESP32 → MQTT → Backend → DB → API → Web

Từ Web về ESP32:  Web → API → Backend → MQTT → ESP32 → Device



Cấu trúc thư mục 
```text

IOT_RTOS_Project/
│
├── hardware/                         # Hardware Engineering
│   ├── README.md
│   │
│   ├── drivers/                      # driver trực tiếp
│   │   ├── dht_sensor.c
│   │   ├── dht_sensor.h
│   │   ├── led.c
│   │   └── led.h
│   │
│   ├── hal/                          # abstraction layer (QUAN TRỌNG)
│   │   ├── device_interface.h
│   │   └── device_interface.c
│   │
│   ├── config/
│   │   └── pin_config.h
│   │
│   └── test/
│       ├── test_sensor.c
│       └── test_led.c
│
├── rtos/                             # RTOS Engineering
│   ├── README.md
│   │
│   ├── tasks/
│   │   ├── task_sensor.c
│   │   ├── task_sensor.h
│   │   ├── task_process.c
│   │   ├── task_process.h
│   │   ├── task_mqtt.c
│   │   ├── task_mqtt.h
│   │   ├── task_control.c
│   │   └── task_control.h
│   │
│   ├── queue/
│   │   ├── data_queue.c
│   │   └── data_queue.h
│   │
│   ├── mqtt/
│   │   ├── mqtt_client.c
│   │   └── mqtt_client.h
│   │
│   ├── config/
│   │   └── config.h
│   │
│   ├── main.c
│   │
│   └── test/
│       ├── test_tasks.c
│       └── test_queue.c
│
├── iot_backend/                      # IoT + Backend + Webserver
│   │
│   ├── backend/
|   |   ├── README.md
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   │
│   │   │   ├── mqtt/
│   │   │   │   └── mqttClient.js
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   └── api.js
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── dataController.js
│   │   │   │   └── controlController.js
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── dbService.js
│   │   │   │   └── mqttService.js
│   │   │   │
│   │   │   ├── models/
│   │   │   │   └── sensorModel.js
│   │   │   │
│   │   │   └── utils/
│   │   │       └── logger.js
│   │   │
│   │   ├── test/
│   │   │   ├── api.test.js
│   │   │   └── mqtt.test.js
│   │   │
│   │   ├── package.json
│   │   └── .env
│   │
│   ├── frontend/
|   |   ├── README.md
│   │   ├── public/
│   │   │   ├── index.html
│   │   │   ├── analytics.html
│   │   │   ├── control.html
│   │   │   │
│   │   │   ├── js/
│   │   │   │   ├── dashboard.js
│   │   │   │   ├── analytics.js
│   │   │   │   ├── control.js
│   │   │   │   └── services/
│   │   │   │       └── api.js        # gọi API tập trung
│   │   │   │
│   │   │   ├── css/
│   │   │   │   └── style.css
│   │   │   │
│   │   │   └── components/           # (optional nâng cao)
│   │   │
│   │   └── test/
│   │       └── ui.test.js
│   │
│   ├── database/
|   |   ├── README.md
|   |   ├── schema.sql          # tạo bảng
|   |   ├── seed.sql            # (optional) dữ liệu mẫu
|   |   └── config/
|   |       └── db.config.js    # config kết nối MySQL
│   │   
│   │
│   └── docker/
|       ├── README.md
│       └── docker-compose.yml
│
├── common/                           # CONTRACT CHUNG
|   ├── README.md  
│   ├── mqtt_topics.h
│   ├── data_format.json
│   └── api_spec.md
│
├── integration_test/                 # test toàn hệ thống
│   ├── test_pipeline.js
│   └── test_control_flow.js
│
├── docs/
│   ├── report.docx
│   ├── diagrams/
│   └── images/
│
├── scripts/
│   └── mock_data.js
│
└── README.md
...

