/**
 * Hợp đồng MQTT / payload — đọc từ IOT_RTOS_Project/common/data_format.json
 * (cùng nguồn với rtos: mqtt_topics.h + SensorData_t trong global.h)
 */
const fs = require('fs');
const path = require('path');

// backend/src/config → lên 4 cấp tới IOT_RTOS_Project/common
const CONTRACT_PATH = path.join(__dirname, '../../../../common/data_format.json');
const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

const mqttTopics = contract.mqtt_topics;

/**
 * Chuẩn hóa payload sensor từ broker → nội bộ backend.
 * RTOS gửi: pm25, co2, voc, timestamp (µs). Hỗ trợ legacy air_quality.
 */
function mapSensorPayload(raw) {
    const parsedTimestamp = parseInt(raw.timestamp_ms ?? raw.timestamp, 10);
    const pm25 = raw.pm25 !== undefined && raw.pm25 !== null ? Number(raw.pm25) : NaN;
    const co2 = raw.co2 !== undefined && raw.co2 !== null ? Number(raw.co2) : NaN;
    const voc = raw.voc !== undefined && raw.voc !== null ? Number(raw.voc) : NaN;
    const legacyAq = raw.air_quality !== undefined && raw.air_quality !== null
        ? Number(raw.air_quality)
        : NaN;

    const air_quality = Number.isFinite(pm25) ? Math.trunc(pm25)
        : (Number.isFinite(legacyAq) ? Math.trunc(legacyAq) : 0);
    const pm25I = Number.isFinite(pm25) ? Math.trunc(pm25)
        : (Number.isFinite(legacyAq) ? Math.trunc(legacyAq) : 0);
    const co2I = Number.isFinite(co2) ? Math.trunc(co2) : 0;
    const vocI = Number.isFinite(voc) ? Math.trunc(voc) : 0;

    const t = parseFloat(raw.temperature);
    const h = parseFloat(raw.humidity);
    return {
        device_id: raw.device_id || 'esp32_device',
        temperature: Number.isFinite(t) ? t : 0,
        humidity: Number.isFinite(h) ? h : 0,
        pm25: pm25I,
        co2: co2I,
        voc: vocI,
        air_quality,
        alert_level: parseInt(raw.alert_level, 10) || 0,
        timestamp_ms: Number.isNaN(parsedTimestamp) ? Date.now() : parsedTimestamp
    };
}

module.exports = {
    CONTRACT_PATH,
    mqttTopics,
    mapSensorPayload
};
