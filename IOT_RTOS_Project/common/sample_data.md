# Sample Data

## MQTT Telemetry

Topic:

```text
iot/sensor/data
```

Payload:

```json
{
  "device_id": "esp32_device",
  "temperature": 28.5,
  "humidity": 65.0,
  "air_quality": 320,
  "alert_level": 0,
  "timestamp_ms": 123456
}
```

Test publish:

```bash
mosquitto_pub -h localhost -t iot/sensor/data -m '{"device_id":"esp32_device","temperature":28.5,"humidity":65.0,"air_quality":320,"alert_level":0,"timestamp_ms":123456}'
```

## MQTT Control

Topic:

```text
iot/device/control
```

Payload:

```json
{
  "device_id": "esp32_device",
  "command": "LED_ON",
  "timestamp": 1710000000000
}
```

Test publish:

```bash
mosquitto_pub -h localhost -t iot/device/control -m '{"device_id":"esp32_device","command":"LED_ON","timestamp":1710000000000}'
```

## API

Latest data:

```bash
curl http://localhost:3000/api/data
```

History:

```bash
curl "http://localhost:3000/api/history?limit=100&hours=24"
```

Control:

```bash
curl -X POST http://localhost:3000/api/control \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32_device","command":"ON"}'
```
