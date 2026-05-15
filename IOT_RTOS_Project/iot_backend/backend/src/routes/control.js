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

router.post('/control/auto',
    asyncHandler(async (req, res) => {
        const { device_id, enabled } = req.body;
        const result = await controlController.setAutoControl(device_id, enabled);
        res.json(result);
    })
);

router.post('/control/device',
    asyncHandler(async (req, res) => {
        const { device_id, device, state } = req.body;
        const result = await controlController.setDeviceState(device_id, device, state);
        res.json(result);
    })
);

router.get('/control/thresholds',
    asyncHandler(async (req, res) => {
        const result = await controlController.requestThresholds(req.query.device_id || 'esp32_device');
        res.json(result);
    })
);

router.post('/control/thresholds',
    asyncHandler(async (req, res) => {
        const { device_id, thresholds } = req.body;
        const result = await controlController.updateThresholds(device_id, thresholds);
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
