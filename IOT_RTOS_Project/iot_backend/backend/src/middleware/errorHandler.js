const logger = require('../logger/winston');

/**
 * Error handling middleware
 * Catches all errors and returns consistent error response
 */

class ApiError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`[${req.method} ${req.path}] Error: ${message}`, {
        status,
        stack: err.stack
    });

    res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * Async error wrapper - Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    ApiError,
    errorHandler,
    asyncHandler,
    notFoundHandler
};
