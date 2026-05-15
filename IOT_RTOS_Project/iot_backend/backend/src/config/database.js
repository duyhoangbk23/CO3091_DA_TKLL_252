const mysql = require('mysql2/promise');
const logger = require('../logger/winston');

let db = null;

/**
 * Database configuration and connection
 */
const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'iot_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * Initialize database connection
 * @returns {Promise<object>} Database connection instance
 */
async function initializeDatabase() {
    try {
        db = await mysql.createConnection(config);
        logger.info(`✓ MySQL connected to ${config.database} @ ${config.host}:${config.port}`);
        return db;
    } catch (error) {
        logger.error(`✗ MySQL connection failed: ${error.message}`);
        logger.warn('Continuing with mock data only...');
        return null;
    }
}

/**
 * Get current database connection
 * @returns {object} Database connection instance or null
 */
function getDatabase() {
    return db;
}

/**
 * Close database connection gracefully
 */
async function closeDatabase() {
    if (db) {
        try {
            await db.end();
            logger.info('✓ Database connection closed');
        } catch (error) {
            logger.error(`Error closing database: ${error.message}`);
        }
    }
}

module.exports = {
    config,
    initializeDatabase,
    getDatabase,
    closeDatabase
};
