/**
 * IoT Backend Server - Main Entry Point
 * 
 * Modular architecture:
 * - config/        Configuration files (database, mqtt, env)
 * - routes/        API endpoint definitions
 * - controllers/   Business logic
 * - models/        Database queries
 * - services/      External services (MQTT)
 * - middleware/    Express middleware (error handling, validation)
 * - logger/        Winston logger setup
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuration
const { initializeDatabase, closeDatabase } = require('./config/database');
const mqttService = require('./services/mqtt');
const sensorController = require('./controllers/sensorController');

// Routes
const sensorRoutes = require('./routes/sensor');
const controlRoutes = require('./routes/control');
const healthRoutes = require('./routes/health');

// Middleware
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

// Logger
const logger = require('./logger/winston');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet()); // Security headers

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ==================== BODY PARSING MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== CORS MIDDLEWARE ====================
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ==================== REQUEST LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger[level](`[${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ==================== ROUTES ====================

// Health check routes
app.use('/', healthRoutes);

// API routes
app.use('/api', sensorRoutes);
app.use('/api', controlRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ==================== SERVER INITIALIZATION ====================

async function startServer() {
    try {
        // Initialize database
        logger.info('Initializing database...');
        await initializeDatabase();

        // Initialize MQTT
        logger.info('Initializing MQTT...');
        mqttService.init(sensorController.handleNewSensorData);

        // Start Express server
        const server = app.listen(PORT, () => {
            logger.info(`\n${'='.repeat(60)}`);
            logger.info('🚀 IoT Backend Server Started');
            logger.info(`${'='.repeat(60)}`);
            logger.info(`✓ Server running on http://localhost:${PORT}`);
            logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`✓ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
            logger.info(`✓ MQTT Broker: ${process.env.MQTT_BROKER}`);
            logger.info(`${'='.repeat(60)}`);
            logger.info('Available endpoints:');
            logger.info('  GET    /health                 Health check');
            logger.info('  GET    /api/data               Latest sensor data');
            logger.info('  GET    /api/history            Historical sensor data');
            logger.info('  GET    /api/stats              Sensor statistics');
            logger.info('  POST   /api/control            Send control command');
            logger.info('  GET    /api/control/history    Control history');
            logger.info(`${'='.repeat(60)}\n`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('\n🛑 Shutting down gracefully...');
            server.close(async () => {
                mqttService.close();
                await closeDatabase();
                logger.info('✓ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGTERM', async () => {
            logger.warn('SIGTERM received, shutting down...');
            server.close(async () => {
                mqttService.close();
                await closeDatabase();
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;

