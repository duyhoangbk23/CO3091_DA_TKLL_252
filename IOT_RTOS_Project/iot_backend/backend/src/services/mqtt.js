const mqtt = require('mqtt');
const logger = require('../logger/winston');

const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = process.env.MQTT_TOPIC_DATA || process.env.MQTT_TOPIC_PUBLISH || 'iot/sensor/data';
const TOPIC_CONTROL = process.env.MQTT_TOPIC_COMMAND || 'iot/device/control';

let client = null;
let dataCallback = null;

/**
 * MQTT Service - Handles MQTT broker communication
 */

/**
 * Initialize MQTT client
 * @param {Function} onDataReceived - Callback when data is received
 * @returns {object} MQTT client instance
 */
function init(onDataReceived) {
    if (client) {
        logger.warn('MQTT client already initialized');
        return client;
    }

    dataCallback = onDataReceived;
    client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
        logger.info(`✓ Connected to MQTT Broker: ${brokerUrl}`);
        client.subscribe(TOPIC_DATA, (err) => {
            if (err) {
                logger.error(`Failed to subscribe to ${TOPIC_DATA}: ${err.message}`);
            } else {
                logger.info(`✓ Subscribed to topic: ${TOPIC_DATA}`);
            }
        });
    });

    client.on('message', (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            logger.debug(`📩 MQTT Message [${topic}]:`, rawData);

            if (topic === TOPIC_DATA && dataCallback) {
                const mappedData = {
                    device_id: rawData.device_id || 'esp32_device',
                    temperature: rawData.temperature,
                    humidity: rawData.humidity,
                    air_quality: rawData.air_quality || 0,
                    alert_level: rawData.alert_level || 0,
                    timestamp: parseInt(rawData.timestamp_ms || rawData.timestamp, 10) || Date.now()
                };

                dataCallback(mappedData);
            }
        } catch (error) {
            logger.error(`Failed to parse MQTT message: ${error.message}`);
        }
    });

    client.on('error', (error) => {
        logger.error(`MQTT Error: ${error.message}`);
    });

    client.on('disconnect', () => {
        logger.warn('⚠ Disconnected from MQTT broker');
    });

    return client;
}

/**
 * Publish control command
 * @param {string} state - Command state (ON/OFF)
 * @returns {boolean} Success status
 */
function publishControl(command, deviceId = 'esp32_device') {
    if (!client || !client.connected) {
        logger.error('Cannot publish: MQTT client not connected');
        return false;
    }

    try {
        const payload = JSON.stringify({
            device_id: deviceId,
            command,
            timestamp: Date.now()
        });
        client.publish(TOPIC_CONTROL, payload, { qos: 1 });
        logger.info(`📤 Control message published: ${payload}`);
        return true;
    } catch (error) {
        logger.error(`Failed to publish control: ${error.message}`);
        return false;
    }
}

/**
 * Check if connected to broker
 * @returns {boolean} Connection status
 */
function isConnected() {
    return client && client.connected;
}

/**
 * Subscribe to custom topic
 * @param {string} topic - Topic name
 * @param {Function} callback - Callback function
 */
function subscribe(topic, callback) {
    if (!client) {
        logger.error('MQTT client not initialized');
        return false;
    }

    client.subscribe(topic, (err) => {
        if (err) {
            logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
            return false;
        }

        logger.info(`✓ Subscribed to topic: ${topic}`);
        return true;
    });
}

/**
 * Publish custom message
 * @param {string} topic - Topic name
 * @param {object} payload - Message payload
 * @returns {boolean} Success status
 */
function publish(topic, payload) {
    if (!client || !client.connected) {
        logger.error('MQTT client not connected');
        return false;
    }

    try {
        const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
        client.publish(topic, message, { qos: 1 });
        logger.debug(`📤 Published to ${topic}: ${message}`);
        return true;
    } catch (error) {
        logger.error(`Failed to publish: ${error.message}`);
        return false;
    }
}

/**
 * Close MQTT connection
 */
function close() {
    if (client) {
        client.end();
        logger.info('MQTT connection closed');
    }
}

module.exports = {
    init,
    publishControl,
    isConnected,
    subscribe,
    publish,
    close
};
