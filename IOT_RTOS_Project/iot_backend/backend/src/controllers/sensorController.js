const sensorModel = require('../models/sensorModel');
const logger = require('../logger/winston');

// In-memory storage for latest data (for real-time MQTT updates)
let latestData = {
    temperature: 0,
    humidity: 0,
    air_quality: 0,
    alert_level: 0,
    timestamp: Date.now()
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
        latestData = {
            temperature: parseFloat(data.temperature),
            humidity: parseFloat(data.humidity),
            air_quality: parseInt(data.air_quality, 10) || 0,
            alert_level: parseInt(data.alert_level, 10) || 0,
            timestamp: parseInt(data.timestamp, 10) || Date.now()
        };

        logger.info(`New MQTT Data: Temp=${latestData.temperature}°C, Humidity=${latestData.humidity}%, AQ=${latestData.air_quality}, Alert=${latestData.alert_level}`);

        // Save to database with optional device_id separate from the sensor payload
        await sensorModel.insertSensorData({
            device_id: data.device_id || 'esp32_device',
            temperature: latestData.temperature,
            humidity: latestData.humidity,
            air_quality: latestData.air_quality,
            alert_level: latestData.alert_level,
            timestamp: latestData.timestamp
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
    latestData = {
        ...latestData,
        ...data,
        timestamp: new Date().toISOString()
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
