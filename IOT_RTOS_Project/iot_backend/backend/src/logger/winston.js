const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let meta = '';
        if (Object.keys(metadata).length > 0) {
            meta = JSON.stringify(metadata);
        }
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}] ${message}\n${stack}\n${meta}`;
        }
        return `${timestamp} [${level.toUpperCase()}] ${message} ${meta}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: logLevel,
    format: customFormat,
    defaultMeta: { service: 'iot-backend' },
    transports: [
        // Console output
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                customFormat
            )
        }),
        // File output - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File output - errors only
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

module.exports = logger;
