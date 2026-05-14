# Frontend Module

Frontend static dashboard dung HTML/CSS/JavaScript, Bootstrap va Chart.js. Nginx trong Docker serve thu muc `public/`.

## Thanh phan

```text
public/
|-- index.html              # Realtime dashboard
|-- analytics.html          # History/charts
|-- control.html            # Control panel
|-- css/style.css
`-- js/
    |-- services/api.js
    |-- dashboard.js
    |-- analytics.js
    |-- control.js
    `-- chartUtils.js
```

## Man hinh

- Dashboard: hien latest telemetry, sensor health, alerts va device state.
- Analytics: doc `/api/history` va `/api/stats` de ve bieu do/thong ke.
- Control: gui lenh auto/manual/device/threshold qua backend API.

## API backend

`public/js/services/api.js` tu dong chon base URL:

- Mo bang file local: `http://localhost:3000/api`
- Serve qua Nginx/Docker: `/api`

API dang dung:

- `GET /api/data`
- `GET /api/history`
- `GET /api/stats`
- `POST /api/control`
- `POST /api/control/auto`
- `POST /api/control/device`
- `GET /api/control/thresholds`
- `POST /api/control/thresholds`
- `GET /api/control/history`
- `GET /health`

## Run

Khuyen dung Docker tu root repo:

```powershell
docker compose up -d --build
```

Link mac dinh:

- Dashboard: http://localhost:8080
- Analytics: http://localhost:8080/analytics.html
- Control: http://localhost:8080/control.html

Co the mo truc tiep file HTML khi backend dang chay o `localhost:3000`, nhung luong gan voi Docker/Nginx la cach chay chinh.

## Luu y

- Khong hardcode mock data trong UI.
- Neu backend mat ket noi, UI can hien trang thai unavailable thay vi gia lap online.
- Timestamp tu ESP32 la thoi gian tu luc boot; `received_at` la thoi gian backend nhan du lieu.
