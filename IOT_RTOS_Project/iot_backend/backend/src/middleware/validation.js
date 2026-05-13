const Joi = require('joi');
const logger = require('../logger/winston');
const { ApiError } = require('./errorHandler');

/**
 * Validation middleware
 * Validates request body, query, params against schemas
 */

/**
 * Validate request against a schema
 * @param {object} schema - Joi schema
 * @param {string} property - 'body', 'query', or 'params'
 */
function validateRequest(schema, property = 'body') {
    return (req, res, next) => {
        const dataToValidate = req[property];
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const messages = error.details.map(detail => detail.message).join(', ');
            logger.warn(`Validation error on ${property}: ${messages}`);
            throw new ApiError(`Validation error: ${messages}`, 400);
        }

        // Replace req property with validated data
        req[property] = value;
        next();
    };
}

/**
 * Validation schemas
 */

const schemas = {
    // Sensor data validation
    sensorData: Joi.object({
        device_id: Joi.string().required(),
        temperature: Joi.number().required(),
        humidity: Joi.number().required(),
        alert_level: Joi.number().integer().min(0).max(2).default(0),
        timestamp_ms: Joi.number().integer().min(0).required()
    }),

    // Control command validation
    controlCommand: Joi.object({
        device_id: Joi.string().required(),
        command: Joi.string().uppercase().valid(
            'REBOOT', 'TEST_LED', 'MUTE_ALARM', 'GET_STATUS',
            'LED_ON', 'LED_OFF',
            'HEPA_ON', 'HEPA_OFF',
            'VENT_ON', 'VENT_OFF',
            'CARBON_ON', 'CARBON_OFF',
            'AC_ON', 'AC_OFF',
            'HUMID_ON', 'HUMID_OFF',
            'ALARM_CO2_ON', 'ALARM_CO2_OFF',
            'ALARM_PM_ON', 'ALARM_PM_OFF',
            'ALARM_VOC_ON', 'ALARM_VOC_OFF',
            'ALARM_TEMP_ON', 'ALARM_TEMP_OFF',
            'ALARM_RH_ON', 'ALARM_RH_OFF'
        ).required()
    }),

    // History query validation
    historyQuery: Joi.object({
        limit: Joi.number().integer().min(1).max(1000).default(100),
        hours: Joi.number().integer().min(1).max(365 * 24).default(24)
    }),

    // Stats query validation
    statsQuery: Joi.object({
        hours: Joi.number().integer().min(1).max(365 * 24).default(24)
    }),

    // Pagination
    pagination: Joi.object({
        limit: Joi.number().integer().min(1).max(1000).default(100),
        offset: Joi.number().integer().min(0).default(0)
    })
};

module.exports = {
    validateRequest,
    schemas,
    ApiError
};
