# Database

MySQL luu lich su telemetry tu MQTT.

## `sensor_data`

```sql
CREATE TABLE sensor_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  temperature FLOAT NOT NULL,
  humidity FLOAT NOT NULL,
  air_quality INT NOT NULL DEFAULT 0,
  alert_level TINYINT NOT NULL DEFAULT 0,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Mapping:
- MQTT/API field `timestamp_ms` duoc luu vao cot DB `timestamp`.
- Khi API tra history, backend alias `timestamp AS timestamp_ms`.

## `control_log`

```sql
CREATE TABLE control_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  command VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Test Query

```sql
SELECT device_id, temperature, humidity, air_quality, alert_level, timestamp AS timestamp_ms, created_at
FROM sensor_data
ORDER BY created_at DESC
LIMIT 10;
```
