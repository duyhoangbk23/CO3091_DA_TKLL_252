# CO3091_DA_TKLL_252

He thong quan trac moi truong IoT dung ESP32/RTOS, MQTT, Node.js backend, MySQL va web dashboard.

## Thu muc chinh

```text
.
├── docker-compose.yml              # Stack chay nhanh: MySQL + MQTT + Backend + Frontend
├── docker/
│   └── config/                     # Cau hinh container nginx va mosquitto
├── docs/                           # Tai lieu chay, Docker, MQTT
├── IOT_RTOS_Project/
│   ├── common/                     # Contract chung: MQTT topics, data format
│   ├── iot_backend/                # Backend, frontend, database schema
│   ├── rtos/                       # Firmware RTOS PlatformIO
│   ├── hardware/                   # Firmware/hardware sketches
│   └── integration_test/
└── Report/
```

## Chay nhanh

Yeu cau: Docker Desktop dang chay.

```powershell
docker compose up -d --build
```

Mo cac link:

- Dashboard: http://localhost:8080
- Control: http://localhost:8080/control.html
- Analytics: http://localhost:8080/analytics.html
- Backend health: http://localhost:3000/health

Dung stack:

```powershell
docker compose down
```

## Tai lieu

- Huong dan chay chi tiet: [docs/RUNNING_GUIDE.md](docs/RUNNING_GUIDE.md)
- Huong dan Docker cu: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
- Huong dan MQTT cu: [docs/MQTT_guild.md](docs/MQTT_guild.md)
- Huong dan project con: [IOT_RTOS_Project/README.md](IOT_RTOS_Project/README.md)

## Ghi chu phat trien

- Contract chung giua firmware va backend nam trong `IOT_RTOS_Project/common`.
- Backend Docker mount `IOT_RTOS_Project/common` vao `/common` de doc `data_format.json`.
- Khong nen chay dong thoi `docker-compose.yml` o root va `IOT_RTOS_Project/docker-compose.yml` vi co the trung port/container name.
