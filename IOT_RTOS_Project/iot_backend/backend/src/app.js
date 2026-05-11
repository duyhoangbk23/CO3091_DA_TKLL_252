/**
 * app.js — Express app factory (tach khoi server startup)
 * Cho phep import trong test ma khong bind cong (port).
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== IN-MEMORY STATE ====================
// latestData duoc export de test co the ghi de
let latestData = {
    device_id:   'esp32_device',
    temperature: 0,
    humidity:    0,
    air_quality: 0,
    alert_level: 0,
    timestamp_ms: 0,
    received_at: null,
    status:      'online'
};

// db va mqttClient duoc inject tu ngoai (de test mock)
let db         = null;
let mqttClient = null;

// ==================== INJECT DEPENDENCIES ====================
function setDb(connection)  { db         = connection; }
function setMqtt(client)    { mqttClient = client;     }
function setLatestData(d)   { latestData = { ...d, status: 'online' }; }
function getLatestData()    { return latestData; }

// ==================== DB HELPERS ====================
async function saveSensorData(data) {
    if (!db) return;
    const q = 'INSERT INTO sensor_data (device_id, temperature, humidity, air_quality, alert_level, timestamp) VALUES (?, ?, ?, ?, ?, ?)';
    await db.query(q, [
        data.device_id,
        data.temperature,
        data.humidity,
        data.air_quality || 0,
        data.alert_level || 0,
        data.timestamp_ms ?? data.timestamp ?? Date.now()
    ]);
}

async function getHistoricalData(limit = 100, hours = 24) {
    if (!db) return [];
    const q = `
        SELECT id, device_id, temperature, humidity, air_quality, alert_level, timestamp AS timestamp_ms, created_at
        FROM sensor_data
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY created_at DESC
        LIMIT ?
    `;
    const [rows] = await db.query(q, [hours, limit]);
    return rows;
}

// ==================== ROUTES ====================

// GET /api/data
app.get('/api/data', (req, res) => {
    res.json({ success: true, data: latestData, timestamp: new Date().toISOString() });
});

// GET /api/history
app.get('/api/history', async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const hours = parseInt(req.query.hours) || 24;

    if (limit > 1000) {
        return res.status(400).json({ success: false, error: 'Limit cannot exceed 1000' });
    }

    const data = await getHistoricalData(limit, hours);
    res.json({ success: true, count: data.length, data, timestamp: new Date().toISOString() });
});

// POST /api/control
app.post('/api/control', async (req, res) => {
    const { device_id, command } = req.body;

    if (!device_id || !command) {
        return res.status(400).json({ success: false, error: 'Missing device_id or command' });
    }

    const state = command.toUpperCase();
    if (state !== 'ON' && state !== 'OFF') {
        return res.status(400).json({ success: false, error: 'Invalid state. Use ON or OFF' });
    }
    const mqttCommand = `LED_${state}`;

    try {
        if (!mqttClient || !mqttClient.publishControl(mqttCommand, device_id)) {
            throw new Error('MQTT client not connected');
        }

        if (db) {
            await db.query(
                'INSERT INTO control_log (device_id, command, status) VALUES (?, ?, ?)',
                [device_id, mqttCommand, 'sent']
            );
        }

        res.json({
            success: true,
            message: `Control "${state}" sent to device "${device_id}"`,
            result: { device_id, command: state, mqtt_command: mqttCommand, status: 'sent', timestamp: new Date().toISOString() }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send control: ' + err.message });
    }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
    if (!db) {
        return res.json({ success: true, data: { message: 'Database not connected' } });
    }
    try {
        const q = `
            SELECT COUNT(*) as total_records,
                   AVG(temperature) as avg_temperature,
                   MAX(temperature) as max_temperature,
                   MIN(temperature) as min_temperature,
                   AVG(humidity)    as avg_humidity
            FROM sensor_data
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        const [rows] = await db.query(q);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /health
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: db ? 'connected' : 'disconnected' });
});

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

module.exports = { app, setDb, setMqtt, setLatestData, getLatestData };
