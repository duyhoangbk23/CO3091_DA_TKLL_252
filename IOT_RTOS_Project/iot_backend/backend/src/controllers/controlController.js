const controlModel = require('../models/controlModel');
const mqttService = require('../services/mqtt');
const logger = require('../logger/winston');

const CONTROL_COMMAND_MAP = {
    REBOOT: 'REBOOT',
    TEST_LED: 'TEST_LED',
    MUTE_ALARM: 'MUTE_ALARM',
    GET_STATUS: 'GET_STATUS',
    LED_ON: 'LED_ON',
    LED_OFF: 'LED_OFF',
    HEPA_ON: 'HEPA_ON',
    HEPA_OFF: 'HEPA_OFF',
    VENT_ON: 'VENT_ON',
    VENT_OFF: 'VENT_OFF',
    CARBON_ON: 'CARBON_ON',
    CARBON_OFF: 'CARBON_OFF',
    AC_ON: 'AC_ON',
    AC_OFF: 'AC_OFF',
    HUMID_ON: 'HUMID_ON',
    HUMID_OFF: 'HUMID_OFF',
    ALARM_CO2_ON: 'ALARM_CO2_ON',
    ALARM_CO2_OFF: 'ALARM_CO2_OFF',
    ALARM_PM_ON: 'ALARM_PM_ON',
    ALARM_PM_OFF: 'ALARM_PM_OFF',
    ALARM_VOC_ON: 'ALARM_VOC_ON',
    ALARM_VOC_OFF: 'ALARM_VOC_OFF',
    ALARM_TEMP_ON: 'ALARM_TEMP_ON',
    ALARM_TEMP_OFF: 'ALARM_TEMP_OFF',
    ALARM_RH_ON: 'ALARM_RH_ON',
    ALARM_RH_OFF: 'ALARM_RH_OFF'
};

/**
 * Control Controller - Business logic for device control commands
 */

/**
 * Send control command to device
 * @param {string} deviceId - Device ID
 * @param {string} command - Command (ON/OFF)
 * @returns {Promise<object>} Response object
 */
async function sendControlCommand(deviceId, command) {
    try {
        // Validate inputs
        if (!deviceId || !command) {
            throw new Error('Missing device_id or command');
        }

        const normalizedCommand = command.toUpperCase();
        const mqttCommand = CONTROL_COMMAND_MAP[normalizedCommand];
        if (!mqttCommand) {
            throw new Error('Invalid command. Use ON or OFF');
        }

        // Publish via MQTT
        const published = mqttService.publishControl(mqttCommand, deviceId);
        if (!published) {
            throw new Error('MQTT client not connected');
        }

        // Log to database
        await controlModel.insertControlLog({
            device_id: deviceId,
            command: mqttCommand,
            status: 'sent'
        });

        logger.info(`Control command sent: ${deviceId} -> ${mqttCommand}`);

        return {
            success: true,
            message: `Control "${normalizedCommand}" sent to device "${deviceId}"`,
            result: {
                device_id: deviceId,
                command: normalizedCommand,
                mqtt_command: mqttCommand,
                status: 'sent',
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        logger.error(`Error sending control command: ${error.message}`);
        throw error;
    }
}

/**
 * Get control command history
 * @param {number} limit - Number of records
 * @returns {Promise<object>} Response object
 */
async function getControlHistory(limit = 100) {
    try {
        const history = await controlModel.getControlHistory(limit);

        return {
            success: true,
            count: history.length,
            data: history,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`Error retrieving control history: ${error.message}`);
        throw error;
    }
}

module.exports = {
    sendControlCommand,
    getControlHistory
};
