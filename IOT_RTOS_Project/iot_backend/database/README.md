# Database

MySQL lưu lịch sử telemetry từ MQTT, khớp payload RTOS (`sensor_data_payload` trong `common/data_format.json`).

## `sensor_data`

| Cột | Kiểu | Ý nghĩa |
|-----|------|--------|
| `device_id` | VARCHAR(50) | ID thiết bị |
| `temperature` | FLOAT | °C |
| `humidity` | FLOAT | %RH |
| `pm25` | INT | PM2.5 µg/m³, `-1` = chưa có |
| `co2` | INT | ppm; `65535` (0xFFFF) = missing như RTOS |
| `voc` | INT | chỉ số VOC raw; `-1` = missing |
| `air_quality` | INT | Cột legacy / proxy (thường trùng PM2.5 khi từ RTOS) |
| `alert_level` | TINYINT | 0/1/2 |
| `timestamp` | BIGINT | `esp_timer_get_time()` µs (hoặc ms) từ thiết bị |
| `created_at` | TIMESTAMP | Thời điểm ghi DB |

API history trả `timestamp` alias `timestamp_ms`.

## `control_log`

Lệnh điều khiển từ backend (MQTT).

## DB đã tồn tại từ trước

Chạy một lần:

```text
migration_001_sensor_rtos_columns.sql
```

Cài mới: import `schema.sql` đầy đủ.

## Test query

```sql
SELECT device_id, temperature, humidity, pm25, co2, voc, air_quality, alert_level,
       timestamp AS timestamp_ms, created_at
FROM sensor_data
ORDER BY created_at DESC
LIMIT 10;
```
