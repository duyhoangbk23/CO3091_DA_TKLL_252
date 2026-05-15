# Backend Module

Backend Node.js/Express nhan telemetry tu MQTT, luu MySQL, giu latest state trong RAM va cung cap API cho dashboard.

## Thanh phan

```text
src/
|-- app.js                  # Express app factory, routes core
|-- server.js               # Startup, DB/MQTT init
|-- config/
|   |-- database.js
|   |-- device.js
|   `-- mqttContract.js     # Doc common/data_format.json
|-- controllers/
|-- models/
|-- routes/
|-- services/mqtt.js
|-- middleware/
`-- logger/
```

## Data flow

```text
ESP32 RTOS -> MQTT iot/sensor/data -> mqtt service -> sensor controller
    -> latestData cache
    -> MySQL sensor_data
    -> GET /api/data, /api/history, /api/stats

Dashboard -> POST /api/control* -> control controller
    -> MQTT iot/device/control
    -> MySQL control_log
```

## API

| API | Vai tro |
| --- | --- |
| `GET /api/data` | Lay latest telemetry/state |
| `GET /api/history?limit=&hours=` | Lay lich su tu MySQL |
| `GET /api/stats` | Thong ke trong khoang thoi gian |
| `POST /api/control` | Gui command legacy/control |
| `POST /api/control/auto` | Bat/tat auto-control |
| `POST /api/control/device` | Dieu khien tung device khi manual mode |
| `GET /api/control/thresholds` | Yeu cau device publish thresholds |
| `POST /api/control/thresholds` | Gui thresholds moi xuong device |
| `GET /api/control/history` | Lich su lenh trong `control_log` |
| `GET /health` | Health check backend/database |

## Cong nghe

- Node.js + Express
- MQTT.js / Mosquitto
- MySQL (`mysql2`)
- Joi validation
- Winston logging
- Jest + Supertest

## Build & run local

```powershell
npm install
npm start
```

Bien moi truong quan trong:

```text
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=iot_user
DB_PASSWORD=iot_password
DB_NAME=iot_db
MQTT_BROKER=mqtt://localhost:1883
```

Stack khuyen dung tu root repo:

```powershell
docker compose up -d --build
```

## Test

```powershell
npm test -- --runInBand
npm run test:unit
npm run test:integration
```

Integration test hien tai mock MQTT broker de kiem tra luong RTOS -> MQTT -> backend -> API va control API -> MQTT. Test nay khong thay the test end-to-end voi ESP32 that.

## Luu y

- MQTT topic/payload lay tu `../../common/data_format.json` qua `src/config/mqttContract.js`.
- Backend luu `timestamp` tu ESP32 vao DB va tra history voi alias `timestamp_ms`.
- Khong hardcode credential; dung `.env` hoac bien moi truong Docker.
