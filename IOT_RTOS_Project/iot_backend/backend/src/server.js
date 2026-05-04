/**
 * IoT Backend Server
 * - Generates mock sensor data every 2 seconds
 * - Provides API endpoints for frontend
 * - Stores data in MySQL for history
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const mqttClient = require('./mqtt/mqttClient');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== DATABASE CONNECTION ====================
let db;

async function initializeDatabase() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('✓ MySQL connected');
    } catch (err) {
        console.error('✗ MySQL connection failed:', err.message);
        console.log('Continuing with mock data only...');
    }
}

// ==================== REAL DATA HANDLING ====================
let latestData = {
    device_id: 'esp32_device',
    temperature: 0,
    humidity: 0,
    
    timestamp: new Date().toISOString(),
    status: 'online'
};


// This function will be called whenever new MQTT data arrives
function handleNewData(data) {
    latestData = {
        ...data,
        status: 'online'
    };
    
    console.log(`📊 MQTT Data: Temp: ${latestData.temperature}°C, Humi: ${latestData.humidity}%`);


    // Save to database
    if (db) {
        saveSensorDataToDatabase(latestData).catch(err => {
            console.error('Failed to save to DB:', err.message);
        });
    }
}


// ==================== DATABASE OPERATIONS ====================
async function saveSensorDataToDatabase(data) {
    if (!db) return;

    try {
        const query = 'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES (?, ?, ?)';
        const values = [data.device_id, data.temperature, data.humidity];
        await db.query(query, values);
    } catch (err) {
        console.error('DB Insert Error:', err.message);
    }
}

async function getHistoricalData(limit = 100, hours = 24) {
    if (!db) {
        console.log('Database not connected');
        return [];
    }

    try {
        const query = `
            SELECT id, device_id, temperature, humidity, created_at
            FROM sensor_data
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const [results] = await db.query(query, [hours, limit]);
        return results;
    } catch (err) {
        console.error('DB Query Error:', err.message);
        return [];
    }
}

// ==================== API ROUTES ====================

/**
 * GET /api/data
 * Returns the latest sensor data (from memory)
 */
app.get('/api/data', (req, res) => {
    res.json({
        success: true,
        data: latestData,
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/history
 * Returns historical sensor data from MySQL
 * Query parameters:
 *   - limit: number of records (default: 100)
 *   - hours: time range in hours (default: 24)
 */
app.get('/api/history', async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const hours = parseInt(req.query.hours) || 24;

    if (limit > 1000) {
        return res.status(400).json({
            success: false,
            error: 'Limit cannot exceed 1000'
        });
    }

    const data = await getHistoricalData(limit, hours);

    res.json({
        success: true,
        count: data.length,
        data: data,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/control
 * Simulates sending control command to device
 * Body: { device_id, command }
 */
app.post('/api/control', async (req, res) => {
    const { device_id, command } = req.body;

    // Validate input
    if (!device_id || !command) {
        return res.status(400).json({
            success: false,
            error: 'Missing device_id or command'
        });
    }

    const state = command.toUpperCase();
    if (state !== 'ON' && state !== 'OFF') {
        return res.status(400).json({
            success: false,
            error: 'Invalid state. Use ON or OFF'
        });
    }

    try {
        // Publish JSON to MQTT Topic: iot/device/control
        const published = mqttClient.publishControl(state);

        if (!published) {
            throw new Error('MQTT client not connected');
        }

        // Log to DB
        if (db) {
            const query = 'INSERT INTO control_log (device_id, command, status) VALUES (?, ?, ?)';
            await db.query(query, [device_id, `LED_${state}`, 'sent']);
        }

        res.json({
            success: true,
            message: `Control "${state}" sent to device "${device_id}"`,
            result: {
                device_id: device_id,
                command: state,
                status: 'sent',
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to send control: ' + err.message
        });
    }


});

/**
 * GET /api/stats
 * Returns statistics about sensor data
 */
app.get('/api/stats', async (req, res) => {
    if (!db) {
        return res.json({
            success: true,
            data: {
                message: 'Database not connected'
            }
        });
    }

    try {
        const query = `
            SELECT 
                COUNT(*) as total_records,
                AVG(temperature) as avg_temperature,
                MAX(temperature) as max_temperature,
                MIN(temperature) as min_temperature,
                AVG(humidity) as avg_humidity
            FROM sensor_data
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        const [results] = await db.query(query);
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// ==================== SERVER STARTUP ====================
async function startServer() {
    await initializeDatabase();
    mqttClient.init(handleNewData);

    app.listen(PORT, () => {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 IoT Backend Server (RTOS Synchronized)');
        console.log('='.repeat(50));
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`📊 MQTT Listener: ACTIVE`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}`);
        console.log('='.repeat(50) + '\n');


        // Test endpoints
        console.log('📋 Available endpoints:');
        console.log(`  GET  http://localhost:${PORT}/api/data`);
        console.log(`  GET  http://localhost:${PORT}/api/history`);
        console.log(`  POST http://localhost:${PORT}/api/control`);
        console.log(`  GET  http://localhost:${PORT}/api/stats`);
        console.log(`  GET  http://localhost:${PORT}/health\n`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    if (db) {
        await db.end();
    }
    process.exit(0);
});
