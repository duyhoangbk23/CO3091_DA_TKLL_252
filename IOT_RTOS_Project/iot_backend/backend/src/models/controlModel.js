const { getDatabase } = require('../config/database');
const logger = require('../logger/winston');

/**
 * Control model - Database queries for control_log table
 */

/**
 * Insert control command log
 * @param {object} data - { device_id, command, status }
 * @returns {Promise<boolean>} Success status
 */
async function insertControlLog(data) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected, skipping insert');
        return false;
    }

    try {
        const query = `
            INSERT INTO control_log (device_id, command, status)
            VALUES (?, ?, ?)
        `;
        const values = [data.device_id, data.command, data.status || 'sent'];
        await db.query(query, values);
        logger.debug(`Control log inserted: ${data.device_id} - ${data.command}`);
        return true;
    } catch (error) {
        logger.error(`Control log insert error: ${error.message}`);
        throw error;
    }
}

/**
 * Get control command history
 * @param {number} limit - Number of records
 * @returns {Promise<array>} Control history records
 */
async function getControlHistory(limit = 100) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected');
        return [];
    }

    try {
        const query = `
            SELECT id, device_id, command, status, created_at
            FROM control_log
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const [results] = await db.query(query, [limit]);
        logger.debug(`Retrieved ${results.length} control history records`);
        return results;
    } catch (error) {
        logger.error(`Control history query error: ${error.message}`);
        throw error;
    }
}

/**
 * Update control command status
 * @param {number} commandId - Command ID
 * @param {string} status - New status
 * @returns {Promise<boolean>} Success status
 */
async function updateControlStatus(commandId, status) {
    const db = getDatabase();
    if (!db) {
        logger.warn('Database not connected');
        return false;
    }

    try {
        const query = `
            UPDATE control_log
            SET status = ?
            WHERE id = ?
        `;
        await db.query(query, [status, commandId]);
        logger.debug(`Control status updated: ${commandId} -> ${status}`);
        return true;
    } catch (error) {
        logger.error(`Control status update error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    insertControlLog,
    getControlHistory,
    updateControlStatus
};
