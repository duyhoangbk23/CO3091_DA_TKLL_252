const sensorModel = require('../models/sensorModel');
const logger = require('../logger/winston');

const { DEFAULT_DEVICE_ID } = require('../config/device');

// In-memory storage for latest data (for real-time MQTT updates)
let latestData = {
    device_id: DEFAULT_DEVICE_ID,
    temperature: 0,
    humidity: 0,
    pm25: 0,
    co2: 0,
    voc: 0,
    alert_level: 0,
    sensor_health: { co2: 'MISSING', pm: 'MISSING', voc: 'MISSING', temp: 'MISSING', rh: 'MISSING' },
    alerts: { co2: false, pm: false, voc: false, temp: false, rh: false },
    devices: { hepa: false, vent: false, carbon: false, ac: false, humid: false },
    auto_control_enabled: true,
    config_version: null,
    ack: null,
    thresholds: null,
    timestamp_ms: 0,
    received_at: null,
    status: 'offline'
};

/**
 * Sensor Controller - Business logic for sensor data
 */

/**
 * Handle new sensor data from MQTT
 * Updates in-memory cache and saves to database
 * @param {object} data - Sensor data from MQTT
 */
async function handleNewSensorData(data) {
    try {
        const parsedTimestamp = parseInt(data.timestamp_ms ?? data.timestamp, 10);
        const pm25 = parseInt(data.pm25, 10) || 0;
        const co2 = parseInt(data.co2, 10) || 0;
        const voc = parseInt(data.voc, 10) || 0;
        latestData = {
            device_id: data.device_id || DEFAULT_DEVICE_ID,
            temperature: data.temperature === null ? null : parseFloat(data.temperature),
            humidity: data.humidity === null ? null : parseFloat(data.humidity),
            pm25,
            co2,
            voc,
            alert_level: parseInt(data.alert_level, 10) || 0,
            timestamp_ms: Number.isNaN(parsedTimestamp) ? Date.now() : parsedTimestamp,
            sensor_health: data.sensor_health || latestData.sensor_health,
            alerts: data.alerts || latestData.alerts,
            devices: data.devices || latestData.devices,
            auto_control_enabled: data.auto_control_enabled !== undefined ? data.auto_control_enabled : latestData.auto_control_enabled,
            config_version: data.config_version ?? latestData.config_version,
            ack: data.ack || latestData.ack,
            thresholds: data.thresholds || latestData.thresholds,
            received_at: new Date().toISOString(),
            status: 'online'
        };

        logger.info(`New MQTT Data: Temp=${latestData.temperature}°C, Humidity=${latestData.humidity}%, PM2.5=${latestData.pm25}, CO2=${latestData.co2}, VOC=${latestData.voc}, Alert=${latestData.alert_level}`);

        // Save to database with optional device_id separate from the sensor payload
        await sensorModel.insertSensorData({
            device_id: latestData.device_id,
            temperature: latestData.temperature ?? 0,
            humidity: latestData.humidity ?? 0,
            pm25: latestData.pm25,
            co2: latestData.co2,
            voc: latestData.voc,
            alert_level: latestData.alert_level,
            timestamp_ms: latestData.timestamp_ms
        });
    } catch (error) {
        logger.error(`Error handling new sensor data: ${error.message}`);
    }
}

/**
 * Get latest sensor data
 * @returns {object} Latest sensor data
 */
function getLatestData() {
    return latestData;
}

/**
 * Get historical sensor data
 * @param {number} limit - Number of records
 * @param {number} hours - Time range
 * @returns {Promise<object>} Response object
 */
async function getHistoricalData(limit = 100, hours = 24) {
    try {
        // Validate inputs
        if (limit > 1000) {
            throw new Error('Limit cannot exceed 1000');
        }
        if (hours > 365) {
            throw new Error('Hours cannot exceed 365');
        }

        const data = await sensorModel.getHistoricalData(limit, hours);

        return {
            success: true,
            count: data.length,
            data: data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`Error retrieving historical data: ${error.message}`);
        throw error;
    }
}

/**
 * Get sensor statistics
 * @param {number} hours - Time range
 * @returns {Promise<object>} Statistics object
 */
async function getStatistics(hours = 24) {
    try {
        const stats = await sensorModel.getStatistics(hours);

        return {
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`Error retrieving statistics: ${error.message}`);
        throw error;
    }
}

/**
 * Update latest data (for testing)
 * @param {object} data - New data
 */
function updateLatestData(data) {
    const parsedTimestamp = parseInt(data.timestamp_ms ?? data.timestamp ?? latestData.timestamp_ms, 10);
    latestData = {
        ...latestData,
        ...data,
        timestamp_ms: Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp,
        received_at: new Date().toISOString(),
        status: data.status || 'online'
    };
    return latestData;
}

module.exports = {
    handleNewSensorData,
    getLatestData,
    getHistoricalData,
    getStatistics,
    updateLatestData
};
