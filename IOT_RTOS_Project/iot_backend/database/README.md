# Database (MySQL)

## Mục tiêu

* Lưu dữ liệu sensor theo thời gian
* Phục vụ truy vấn lịch sử

---

## Công nghệ

* MySQL

---

## Cấu trúc

* `schema.sql`: tạo bảng
* `seed.sql`: dữ liệu mẫu (optional)
* `config/`: cấu hình kết nối DB

---

## Thiết kế bảng

```sql
CREATE TABLE sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(50),
  temperature FLOAT,
  humidity FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Công việc cần làm

* Kết nối backend với MySQL
* Lưu dữ liệu từ MQTT vào DB
* Truy vấn dữ liệu cho API `/api/history`

---

## Cách chạy

### 1. Tạo database

```sql
CREATE DATABASE iot_db;
```

### 2. Import schema

```bash
mysql -u root -p iot_db < schema.sql
```

---

## Kết nối từ backend

```js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'iot_db'
});
```

---

## Test

### Insert thử:

```sql
INSERT INTO sensor_data (device_id, temperature, humidity)
VALUES ('esp32_1', 30, 70);
```

### Query:

```sql
SELECT * FROM sensor_data;
```

---

## Lưu ý

* Realtime KHÔNG lấy từ DB (dùng RAM trong backend)
* DB chỉ dùng cho lịch sử
* Nên index cột `created_at`
