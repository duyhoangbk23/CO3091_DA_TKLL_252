# Integration Test

Thu muc nay danh cho test tich hop end-to-end cua he thong. Hien repo da co mot phan integration test cho backend o:

```text
iot_backend/backend/tests/integration/rtos_backend.test.js
```

Test backend hien tai mock MQTT broker de kiem tra:

- ESP32/RTOS publish telemetry -> MQTT service -> backend latest data -> API.
- Backend API publish control command -> MQTT topic `iot/device/control`.
- Mot so truong hop mat ket noi MQTT va ghi `control_log`.

Chay tu thu muc backend:

```powershell
cd IOT_RTOS_Project\iot_backend\backend
npm run test:integration
```

## Test end-to-end can bo sung

Khi co phan cung ESP32 va Docker stack dang chay, nen bo sung test that cho hai pipeline:

### Data pipeline

```text
Sensor -> ESP32 RTOS -> MQTT -> Backend -> MySQL -> API -> Web
```

Can kiem tra:

- Payload co dung `common/data_format.json`.
- Backend cap nhat `/api/data`.
- Record duoc ghi vao `sensor_data`.
- Dashboard hien dung latest data va sensor health.

### Control pipeline

```text
Web -> API -> Backend -> MQTT -> ESP32 RTOS -> IaqController/LED
```

Can kiem tra:

- `POST /api/control/device` publish dung command.
- ESP32 nhan lenh qua `xControlQueue`.
- Manual command bi tu choi khi auto-control dang bat.
- ESP32 publish ACK len `iot/device/status`.
- Backend/UI hien command status hoac latest ACK.

## Luu y

- Test mock MQTT giup kiem tra contract backend nhanh, nhung chua xac nhan duoc Wi-Fi, broker that, wiring cam bien hay LED.
- End-to-end phan cung can cau hinh `rtos/include/local_config.h` voi IP LAN cua broker, khong dung `localhost`.
