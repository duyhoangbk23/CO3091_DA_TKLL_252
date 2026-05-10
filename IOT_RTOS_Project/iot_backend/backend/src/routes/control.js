const express = require('express');
const controlController = require('../controllers/controlController');
const { validateRequest, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Control Routes
 * POST /api/control   - Send control command to device
 * GET  /api/control/history - Get control command history
 */

/**
 * POST /api/control
 * Send control command to device
 * Body: { device_id, command }
 */
router.post('/control',
    validateRequest(schemas.controlCommand, 'body'),
    asyncHandler(async (req, res) => {
        const { device_id, command } = req.body;
        const result = await controlController.sendControlCommand(device_id, command);
        res.json(result);
    })
);

/**
 * GET /api/control/history
 * Get control command history
 * Query params: limit
 */
router.get('/control/history',
    asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const result = await controlController.getControlHistory(limit);
        res.json(result);
    })
);

module.exports = router;
