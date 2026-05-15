# Database

MySQL luu lich su telemetry tu MQTT va lich su command tu backend. Schema chinh nam trong `schema.sql`, khop payload RTOS trong `common/data_format.json`.

## `sensor_data`

| Cot | Kieu | Y nghia |
| --- | --- | --- |
| `id` | INT AUTO_INCREMENT | Khoa chinh |
| `device_id` | VARCHAR(50) | ID thiet bi |
| `temperature` | FLOAT | Nhiet do C, backend ghi 0 neu payload null khi insert |
| `humidity` | FLOAT | Do am %RH, backend ghi 0 neu payload null khi insert |
| `pm25` | INT | PM2.5 ug/m3, `-1` = missing |
| `co2` | INT | CO2 ppm, `65535` = missing tu RTOS |
| `voc` | INT | VOC raw/index, `-1` = missing |
| `alert_level` | TINYINT | `0=OK`, `1=WARN`, `2=CRITICAL` |
| `timestamp` | BIGINT | Timestamp tu ESP32, hien la `esp_timer_get_time()` us |
| `created_at` | TIMESTAMP | Thoi diem backend/MySQL ghi record |

Index:

- `idx_device_id`
- `idx_timestamp`
- `idx_created_at`

API history tra `timestamp` voi alias `timestamp_ms`.

## `control_log`

Luu cac lenh backend da publish xuong MQTT:

| Cot | Kieu | Y nghia |
| --- | --- | --- |
| `id` | INT AUTO_INCREMENT | Khoa chinh |
| `device_id` | VARCHAR(50) | ID thiet bi |
| `command` | VARCHAR(100) | Lenh da gui |
| `status` | VARCHAR(20) | Trang thai, mac dinh `pending`/`sent` |
| `created_at` | TIMESTAMP | Thoi diem ghi log |

## Cai dat

Cai moi: import `schema.sql`.

Neu DB cu chua co cac cot RTOS moi, chay mot lan:

```text
migration_001_sensor_rtos_columns.sql
```

## Test query

```sql
SELECT device_id, temperature, humidity, pm25, co2, voc, alert_level,
       timestamp AS timestamp_ms, created_at
FROM sensor_data
ORDER BY created_at DESC
LIMIT 10;
```
