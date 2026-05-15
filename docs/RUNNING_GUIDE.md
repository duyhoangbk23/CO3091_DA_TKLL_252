# Huong dan chay toan bo chuong trinh

Tai lieu nay mo ta cach chay day du he thong: thiet bi ESP32/RTOS, MQTT broker, backend Node.js, MySQL database va web dashboard.

## 1. Tong quan kien truc

Luong du lieu sensor:

```text
ESP32/RTOS -> MQTT broker -> Backend -> MySQL -> API -> Dashboard
```

Luong dieu khien:

```text
Dashboard -> API -> Backend -> MQTT broker -> ESP32/RTOS
```

Port mac dinh:

| Thanh phan | Port | Link/host |
| --- | ---: | --- |
| Frontend nginx | 8080 | http://localhost:8080 |
| Backend API | 3000 | http://localhost:3000 |
| MQTT | 1883 | mqtt://<IP-may-tinh>:1883 |
| MQTT WebSocket | 9001 | ws://<IP-may-tinh>:9001 |
| MySQL | 3306 | localhost:3306 |

## 2. Yeu cau

- Docker Desktop da mo va dang chay.
- Node.js 18+ neu muon chay backend/test ngoai Docker.
- PlatformIO neu muon build/upload firmware RTOS.
- ESP32 da cau hinh WiFi va MQTT broker tro ve IP may tinh dang chay Docker.

Kiem tra Docker:

```powershell
docker --version
docker compose version
docker ps
```

## 3. Chay full stack bang Docker

Chay tu thu muc root cua repo:

```powershell
cd D:\ADUY\252\DA_TKLL\CO3091_DA_TKLL_252
docker compose up -d --build
```

Kiem tra container:

```powershell
docker ps
```

Trang thai mong doi:

```text
iot-mysql      healthy
iot-mqtt       healthy
iot-backend    healthy
iot-frontend   Up
```

Kiem tra backend:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Ket qua mong doi:

```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "mqtt": "connected"
  }
}
```

Mo dashboard:

- http://localhost:8080
- http://localhost:8080/control.html
- http://localhost:8080/analytics.html

## 4. Cau hinh thiet bi ESP32

Thiet bi can publish MQTT vao broker tren may tinh:

```text
MQTT host: <IP LAN cua may tinh>
MQTT port: 1883
Topic sensor: iot/sensor/data
Topic status: iot/device/status
Topic control: iot/device/control
```

Lay IP LAN tren Windows:

```powershell
ipconfig
```

Tim adapter WiFi/Ethernet dang dung va lay `IPv4 Address`, vi du `192.168.1.10`.

Payload sensor backend dang doc theo contract:

```json
{
  "device_id": "esp32_device",
  "temperature": 30.5,
  "humidity": 65.0,
  "pm25": 15,
  "co2": 450,
  "voc": 350,
  "alert_level": 0,
  "timestamp": 123456789
}
```

Contract chinh thuc nam tai:

- `IOT_RTOS_Project/common/mqtt_topics.h`
- `IOT_RTOS_Project/common/data_format.json`

## 5. Kiem tra API

Doc data moi nhat:

```powershell
Invoke-RestMethod http://localhost:3000/api/data
```

Doc lich su:

```powershell
Invoke-RestMethod "http://localhost:3000/api/history?limit=10&hours=24"
```

Doc thong ke:

```powershell
Invoke-RestMethod "http://localhost:3000/api/stats?hours=24"
```

Gui lenh dieu khien:

```powershell
$body = @{ device_id = "esp32_device"; command = "GET_STATUS" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/control -ContentType "application/json" -Body $body
```

Xem lich su lenh:

```powershell
Invoke-RestMethod "http://localhost:3000/api/control/history?limit=10"
```

Cac command hop le:

```text
ON, OFF, REBOOT, TEST_LED, MUTE_ALARM, GET_STATUS,
LED_ON, LED_OFF,
HEPA_ON, HEPA_OFF,
VENT_ON, VENT_OFF,
CARBON_ON, CARBON_OFF,
AC_ON, AC_OFF,
HUMID_ON, HUMID_OFF,
ALARM_CO2_ON, ALARM_CO2_OFF,
ALARM_PM_ON, ALARM_PM_OFF,
ALARM_VOC_ON, ALARM_VOC_OFF,
ALARM_TEMP_ON, ALARM_TEMP_OFF,
ALARM_RH_ON, ALARM_RH_OFF
```

## 6. Kiem tra database

Vao MySQL container:

```powershell
docker exec -it iot-mysql mysql -uiot_user -piot_password iot_db
```

Truy van nhanh:

```sql
SELECT COUNT(*) FROM sensor_data;
SELECT * FROM sensor_data ORDER BY id DESC LIMIT 5;
SELECT * FROM control_log ORDER BY id DESC LIMIT 5;
```

Chay mot lenh truc tiep tu PowerShell:

```powershell
docker exec iot-mysql mysql -uiot_user -piot_password iot_db -e "SELECT COUNT(*) AS sensor_count FROM sensor_data; SELECT COUNT(*) AS control_count FROM control_log;"
```

## 7. Kiem tra MQTT

Xem log MQTT/backend:

```powershell
docker logs -f iot-mqtt
docker logs -f iot-backend
```

Publish data gia lap vao broker:

```powershell
docker exec iot-mqtt mosquitto_pub -h localhost -t iot/sensor/data -m '{\"device_id\":\"esp32_device\",\"temperature\":28.5,\"humidity\":60,\"pm25\":20,\"co2\":500,\"voc\":240,\"alert_level\":0,\"timestamp\":123456789}'
```

Sau do kiem tra:

```powershell
Invoke-RestMethod http://localhost:3000/api/data
```

## 8. Kiem tra UI

Dashboard:

- Mo http://localhost:8080
- `Connection` phai la `Connected`.
- Sensor cards phai hien temperature, humidity, PM2.5/air quality va alert level.
- Nut `Refresh Now` phai goi lai `/api/data`.

Analytics:

- Mo http://localhost:8080/analytics.html
- Bam `Load Data`.
- Bang du lieu va chart phai hien records tu `/api/history`.

Control:

- Mo http://localhost:8080/control.html
- Bang live sensor phai hien data moi nhat.
- Chon `GET_STATUS`, bam `Send Command`.
- Thu quick buttons `Turn LED ON` va `Turn LED OFF`.
- Kiem tra `/api/control/history` hoac bang `control_log`.

## 9. Chay test backend

Backend co Jest test trong `IOT_RTOS_Project/iot_backend/backend`.

```powershell
cd IOT_RTOS_Project\iot_backend\backend
npm install
npm test -- --runInBand
```

`--runInBand` giup tranh loi heap khi collect coverage tren Windows.

## 10. Chay backend local khong dung Docker backend

Van nen chay MySQL va MQTT bang Docker:

```powershell
docker compose up -d mysql mqtt
```

Chay backend local:

```powershell
cd IOT_RTOS_Project\iot_backend\backend
npm install
$env:PORT = "3000"
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_USER = "iot_user"
$env:DB_PASSWORD = "iot_password"
$env:DB_NAME = "iot_db"
$env:MQTT_BROKER = "mqtt://localhost:1883"
npm start
```

Neu frontend van chay qua Docker nginx, backend local can cung port `3000`.

## 11. Dung, restart, reset du lieu

Dung stack:

```powershell
docker compose down
```

Restart backend:

```powershell
docker compose restart backend
```

Xem log:

```powershell
docker compose logs -f backend
docker compose logs -f mqtt
docker compose logs -f mysql
```

Reset database va MQTT volume:

```powershell
docker compose down -v
docker compose up -d --build
```

Lenh `down -v` se xoa du lieu MySQL hien co.

## 12. Loi thuong gap

Backend restart lien tuc:

- Chay `docker logs iot-backend`.
- Kiem tra mount `./IOT_RTOS_Project/common:/common:ro` trong `docker-compose.yml`.
- Kiem tra `IOT_RTOS_Project/common/data_format.json` ton tai.

Frontend hien disconnected:

- Kiem tra `http://localhost:3000/health`.
- Kiem tra container backend co `healthy`.
- Kiem tra nginx proxy bang `http://localhost:8080/api/data`.

Khong co data tren dashboard:

- Kiem tra ESP32 dang publish topic `iot/sensor/data`.
- Kiem tra IP MQTT tren ESP32 la IP LAN cua may tinh, khong phai `localhost`.
- Kiem tra log backend co dong `New MQTT Data`.

Nut control khong tac dung:

- Kiem tra `POST /api/control` tra `success: true`.
- Kiem tra backend log co `Control message published`.
- Kiem tra ESP32 subscribe topic `iot/device/control`.

Port bi trung:

- Doi port bang bien moi truong truoc khi chay Docker, vi du:

```powershell
$env:PORT = "3002"
$env:FRONTEND_PORT = "8081"
docker compose up -d
```

## 13. Ghi chu ve compose

Repo co compose chinh o root va mot compose phu trong `IOT_RTOS_Project`. Nen dung compose o root cho demo va test full stack:

```powershell
docker compose up -d --build
```

Khong chay ca hai compose cung luc neu chua doi container name/port, vi chung dung cac ten `iot-mysql`, `iot-mqtt`, `iot-backend`.
