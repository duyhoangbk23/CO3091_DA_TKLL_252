const express = require('express');
const sensorController = require('../controllers/sensorController');
const { validateRequest, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Sensor Routes
 * GET  /api/data       - Get latest sensor data
 * GET  /api/history    - Get historical sensor data
 * GET  /api/stats      - Get sensor statistics
 */

/**
 * GET /api/data
 * Returns the latest sensor data from MQTT
 */
router.get('/data', asyncHandler((req, res) => {
    const data = sensorController.getLatestData();
    res.json({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
    });
}));

/**
 * GET /api/history
 * Returns historical sensor data from database
 * Query params: limit, hours
 */
router.get('/history',
    validateRequest(schemas.historyQuery, 'query'),
    asyncHandler(async (req, res) => {
        const { limit, hours } = req.query;
        const result = await sensorController.getHistoricalData(limit, hours);
        res.json(result);
    })
);

/**
 * GET /api/stats
 * Returns statistics for sensor data
 * Query params: hours
 */
router.get('/stats',
    validateRequest(schemas.statsQuery, 'query'),
    asyncHandler(async (req, res) => {
        const { hours } = req.query;
        const result = await sensorController.getStatistics(hours);
        res.json(result);
    })
);

module.exports = router;
