const { getDatabase } = require('../config/database');
const logger = require('../logger/winston');

/**
 * Sensor data model - Database queries for sensor_data table
 */

/**
 * Insert sensor data into database
 * @param {object} data - { device_id, temperature, humidity, air_quality, alert_level, timestamp }
 * @returns {Promise<boolean>} Success status
 */
async function insertSensorData(data) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected, skipping insert');
        return false;
    }

    try {
        const query = `
            INSERT INTO sensor_data (device_id, temperature, humidity, air_quality, alert_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.device_id,
            data.temperature,
            data.humidity,
            data.air_quality || 0,
            data.alert_level || 0,
            data.timestamp || Date.now()
        ];
        await db.query(query, values);
        logger.debug(`Sensor data inserted: ${data.device_id}`);
        return true;
    } catch (error) {
        logger.error(`Database insert error: ${error.message}`);
        throw error;
    }
}

/**
 * Get historical sensor data
 * @param {number} limit - Number of records to fetch
 * @param {number} hours - Time range in hours
 * @returns {Promise<array>} Historical data records
 */
async function getHistoricalData(limit = 100, hours = 24) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected');
        return [];
    }

    try {
        const query = `
            SELECT id, device_id, temperature, humidity, air_quality, alert_level, timestamp, created_at
            FROM sensor_data
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const [results] = await db.query(query, [hours, limit]);
        logger.debug(`Retrieved ${results.length} historical records`);
        return results;
    } catch (error) {
        logger.error(`Database query error: ${error.message}`);
        throw error;
    }
}

/**
 * Get statistics for sensor data
 * @param {number} hours - Time range in hours
 * @returns {Promise<object>} Statistics object
 */
async function getStatistics(hours = 24) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected');
        return null;
    }

    try {
        const query = `
            SELECT 
                COUNT(*) as total_records,
                AVG(temperature) as avg_temperature,
                MAX(temperature) as max_temperature,
                MIN(temperature) as min_temperature,
                AVG(humidity) as avg_humidity,
                MAX(humidity) as max_humidity,
                MIN(humidity) as min_humidity,
                AVG(air_quality) as avg_air_quality,
                MAX(air_quality) as max_air_quality,
                MIN(air_quality) as min_air_quality,
                AVG(alert_level) as avg_alert_level,
                MAX(alert_level) as max_alert_level,
                MIN(alert_level) as min_alert_level
            FROM sensor_data
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        `;
        const [results] = await db.query(query, [hours]);
        logger.debug('Statistics calculated');
        return results[0];
    } catch (error) {
        logger.error(`Statistics query error: ${error.message}`);
        throw error;
    }
}

/**
 * Get latest sensor data for specific device
 * @param {string} deviceId - Device ID
 * @returns {Promise<object>} Latest sensor record or null
 */
async function getLatestByDevice(deviceId) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected');
        return null;
    }

    try {
        const query = `
            SELECT * FROM sensor_data
            WHERE device_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
        `;
        const [results] = await db.query(query, [deviceId]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        logger.error(`Error fetching latest data: ${error.message}`);
        throw error;
    }
}

module.exports = {
    insertSensorData,
    getHistoricalData,
    getStatistics,
    getLatestByDevice
};
