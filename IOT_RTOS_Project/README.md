# IOT_RTOS_Project

Thu muc chua code chinh cua he thong IoT RTOS.

```text
IOT_RTOS_Project/
├── common/             # Contract chung MQTT topic va payload
├── hardware/           # Arduino/hardware sketches
├── rtos/               # PlatformIO RTOS firmware
├── iot_backend/        # Backend Node.js, frontend static, database schema
├── integration_test/   # Test tich hop
└── scripts/            # Script legacy ho tro workflow local/firmware
```

Huong dan chay day du va dung nhat nam o:

```text
../docs/RUNNING_GUIDE.md
```

Lenh demo khuyen dung, chay tu root repo:

```powershell
docker compose up -d --build
```

Link mac dinh:

- Dashboard: http://localhost:8080
- Control: http://localhost:8080/control.html
- Analytics: http://localhost:8080/analytics.html
- Backend health: http://localhost:3000/health

Backend test:

```powershell
cd iot_backend\backend
npm test -- --runInBand
```

Ghi chu:

- Cac tai lieu cu bi sai port/endpoint/mock-data da duoc xoa de tranh nham lan.
- Cac script trong `scripts/` chi dung cho workflow local/firmware; Docker stack o root van la cach chay chinh.
