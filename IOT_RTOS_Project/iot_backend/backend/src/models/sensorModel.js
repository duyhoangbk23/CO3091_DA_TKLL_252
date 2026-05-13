const { getDatabase } = require('../config/database');
const logger = require('../logger/winston');

/**
 * Sensor data model - Database queries for sensor_data table
 */

/**
 * Insert sensor data into database
 * @param {object} data - { device_id, temperature, humidity, pm25, co2, voc, air_quality, alert_level, timestamp_ms }
 * @returns {Promise<boolean>} Success status
 */
async function insertSensorData(data) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected, skipping insert');
        return false;
    }

    try {
        const pm25 = data.pm25 !== undefined && data.pm25 !== null ? parseInt(data.pm25, 10) : -1;
        const co2 = data.co2 !== undefined && data.co2 !== null ? parseInt(data.co2, 10) : -1;
        const voc = data.voc !== undefined && data.voc !== null ? parseInt(data.voc, 10) : -1;
        const airQ = data.air_quality !== undefined && data.air_quality !== null
            ? parseInt(data.air_quality, 10)
            : (Number.isFinite(pm25) && pm25 >= 0 ? pm25 : 0);

        const query = `
            INSERT INTO sensor_data (device_id, temperature, humidity, pm25, co2, voc, air_quality, alert_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.device_id,
            data.temperature,
            data.humidity,
            Number.isNaN(pm25) ? -1 : pm25,
            Number.isNaN(co2) ? -1 : co2,
            Number.isNaN(voc) ? -1 : voc,
            Number.isNaN(airQ) ? 0 : airQ,
            data.alert_level || 0,
            data.timestamp_ms ?? data.timestamp ?? Date.now()
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
            SELECT id, device_id, temperature, humidity, pm25, co2, voc, air_quality, alert_level,
                   timestamp AS timestamp_ms, created_at
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
                AVG(pm25) as avg_pm25,
                MAX(pm25) as max_pm25,
                MIN(pm25) as min_pm25,
                AVG(co2) as avg_co2,
                MAX(co2) as max_co2,
                MIN(co2) as min_co2,
                AVG(voc) as avg_voc,
                MAX(voc) as max_voc,
                MIN(voc) as min_voc,
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
