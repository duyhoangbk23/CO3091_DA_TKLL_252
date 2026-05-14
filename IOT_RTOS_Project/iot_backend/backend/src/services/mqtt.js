const mqtt = require('mqtt');
const logger = require('../logger/winston');
const { mqttTopics, mapSensorPayload } = require('../config/mqttContract');
const { DEFAULT_DEVICE_ID } = require('../config/device');

const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = process.env.MQTT_TOPIC_DATA || process.env.MQTT_TOPIC_PUBLISH || mqttTopics.sensor_data;
const TOPIC_STATUS = process.env.MQTT_TOPIC_STATUS || mqttTopics.device_status;
const TOPIC_CONTROL = process.env.MQTT_TOPIC_COMMAND || mqttTopics.device_control;

let client = null;
let dataCallback = null;
let latestData = null;
let latestAck = null;
let latestThresholds = null;

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
        const subs = [TOPIC_DATA, TOPIC_STATUS];
        client.subscribe(subs, { qos: 1 }, (err) => {
            if (err) {
                logger.error(`Failed to subscribe to ${subs.join(', ')}: ${err.message}`);
            } else {
                logger.info(`✓ Subscribed to topics: ${subs.join(', ')}`);
            }
        });
    });

    client.on('message', (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            logger.debug(`📩 MQTT Message [${topic}]:`, rawData);

            if ((topic === TOPIC_DATA || topic === TOPIC_STATUS) && dataCallback) {
                const mappedData = mapSensorPayload(rawData);
                if (mappedData.ack) latestAck = mappedData.ack;
                if (mappedData.thresholds) latestThresholds = mappedData.thresholds;
                latestData = { ...(latestData || {}), ...mappedData };
                dataCallback(latestData);
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
function publishControl(command, deviceId = DEFAULT_DEVICE_ID) {
    if (!client || !client.connected) {
        logger.error('Cannot publish: MQTT client not connected');
        return false;
    }

    try {
        const payload = JSON.stringify(typeof command === 'string'
            ? { device_id: deviceId, command, timestamp: Date.now() }
            : { device_id: deviceId, ...command, timestamp: Date.now() });
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

function getLatestData() {
    return latestData;
}

function getLatestAck() {
    return latestAck;
}

function getLatestThresholds() {
    return latestThresholds;
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
    client = null;
    dataCallback = null;
    latestData = null;
}

module.exports = {
    init,
    publishControl,
    isConnected,
    getLatestData,
    getLatestAck,
    getLatestThresholds,
    subscribe,
    publish,
    close
};
