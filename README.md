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

IOT\_RTOS\_Project/

│

├── hardware/  # Hardware Engineering

|	├──Readme.md

|	├── drivers/

|	│   ├── dht\_sensor.c

|	│   ├── dht\_sensor.h

|	│   ├── led.c

|	│   └── led.h

|	│

|	├── config/

|	│   └── pin\_config.h

|	│

|	└── test/

|	    └── test\_sensor.c            

│

├── rtos/ # RTOS Engineering

|	├──Readme.md

|	├── tasks/

|	│   ├── task\_sensor.c

|	│   ├── task\_process.c

|	│   ├── task\_mqtt.c

|	│   └── task\_control.c

|	│

|	├── queue/

|	│   └── data\_queue.c

|	│

|	├── mqtt/

|	│   └── mqtt\_client.c

|	│

|	├── main.c

|	└── config.h                   

│

├──iot\_backend/  # IoT + Backend + Webserver

|	├──Readme.md

|	├── backend/

|	│   	├── src/

|	│   	│   ├── server.js

|	│   	│   ├── mqtt/

|	│   	│   │   └── mqttClient.js

|	│   	│   ├── routes/

|	│   	│   │   └── api.js

|	│   	│   ├── controllers/

|	│   	│   ├── services/

|	│   	│   │   └── dbService.js

|	│   	│   └── models/

|	│   	│       └── sensorModel.js

|	│   	│

|	│   	└── package.json

|	├──frontend/

|	|	└── public/

|	|	    ├── index.html        # Dashboard

|    	|	    ├── analytics.html    # History

|    	|	    ├── control.html      # Control

|    	|	    ├── js/

|    	|	    │   ├── dashboard.js

|    	|	    │   ├── analytics.js

|    	|	    │   └── control.js

|    	|	    └── css/

|       |     	    └── style.css

|	├── database/

|	│   └── influx\_setup.md

|	│

|	└── docker/

|	    └── docker-compose.yml

├──intergration\_test/

|	├──test\_pipeline.js         

│		└──test\_control\_flow

├── docs/                    # báo cáo

└── README.md

