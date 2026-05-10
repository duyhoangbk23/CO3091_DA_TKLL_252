const sensorModel = require('../models/sensorModel');
const logger = require('../logger/winston');

// In-memory storage for latest data (for real-time MQTT updates)
let latestData = {
    device_id: 'esp32_device',
    temperature: 0,
    humidity: 0,
    timestamp: new Date().toISOString(),
    status: 'online'
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
            device_id: data.device_id || 'esp32_device',
            temperature: parseFloat(data.temperature),
            humidity: parseFloat(data.humidity),
            timestamp: data.timestamp || new Date().toISOString(),
            status: 'online'
        };

        logger.info(`📊 New MQTT Data: Temp=${latestData.temperature}°C, Humidity=${latestData.humidity}%`);

        // Save to database
        await sensorModel.insertSensorData(latestData);
    } catch (error) {
        logger.error(`Error handling new sensor data: ${error.message}`);
    }
}

/**
 * Get latest sensor data
 * @returns {object} Latest sensor data
 */
function getLatestData() {
    return {
        ...latestData,
        timestamp: new Date().toISOString()
    };
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
