const express = require('express');
const { getDatabase } = require('../config/database');
const mqttService = require('../services/mqtt');
const logger = require('../logger/winston');

const router = express.Router();

/**
 * Health Check Routes
 * GET /health - Basic health check
 */

/**
 * GET /health
 * Returns health status of backend services
 */
router.get('/health', (req, res) => {
    const db = getDatabase();
    const mqttConnected = mqttService.isConnected();

    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: db ? 'connected' : 'disconnected',
            mqtt: mqttConnected ? 'connected' : 'disconnected'
        },
        uptime: process.uptime()
    };

    const overallStatus = (db && mqttConnected) ? 200 : 503;
    res.status(overallStatus).json(health);
});

/**
 * GET /health/live
 * Liveness probe - Just check if server is running
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /health/ready
 * Readiness probe - Check if all dependencies are ready
 */
router.get('/health/ready', (req, res) => {
    const db = getDatabase();
    const mqttConnected = mqttService.isConnected();

    if (!db || !mqttConnected) {
        return res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            issues: {
                database: db ? 'ok' : 'disconnected',
                mqtt: mqttConnected ? 'ok' : 'disconnected'
            }
        });
    }

    res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
