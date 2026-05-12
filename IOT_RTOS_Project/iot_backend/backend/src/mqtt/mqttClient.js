const mqtt = require('mqtt');
require('dotenv').config();
const { mqttTopics, mapSensorPayload } = require('../config/mqttContract');

// Configuration — topic mặc định từ common/data_format.json
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = process.env.MQTT_TOPIC_DATA || process.env.MQTT_TOPIC_PUBLISH || mqttTopics.sensor_data;
const TOPIC_STATUS = process.env.MQTT_TOPIC_STATUS || mqttTopics.device_status;
const TOPIC_CONTROL = process.env.MQTT_TOPIC_COMMAND || mqttTopics.device_control;


let client = null;
let latestData = null;
let dataCallback = null;

/**
 * Initialize MQTT Client
 * @param {Function} onDataReceived Callback for when new sensor data arrives
 */
function init(onDataReceived) {
    if (client) return;

    dataCallback = onDataReceived;
    client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
        console.log('✓ Connected to MQTT Broker: ' + brokerUrl);
        client.subscribe([TOPIC_DATA, TOPIC_STATUS], { qos: 1 }, (err) => {
            if (!err) {
                console.log(`✓ Subscribed to topics: ${TOPIC_DATA}, ${TOPIC_STATUS}`);
            }
        });
    });


    client.on('message', (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            console.log(`📩 MQTT Message [${topic}]:`, rawData);

            if (topic === TOPIC_DATA || topic === TOPIC_STATUS) {
                const mappedData = mapSensorPayload(rawData);

                latestData = mappedData;

                if (dataCallback) {
                    dataCallback(mappedData);
                }
            }
        } catch (err) {
            console.error('✗ Failed to parse MQTT message:', err.message);
        }
    });


    client.on('error', (err) => {
        console.error('✗ MQTT Error:', err.message);
    });

    return client;
}

/**
 * Publish control command to Device
 * @param {string} state 'ON' or 'OFF'
 */
function publishControl(command, deviceId = 'esp32_device') {
    if (!client || !client.connected) {
        console.error('✗ Cannot publish: MQTT client not connected');
        return false;
    }

    const payload = JSON.stringify({
        device_id: deviceId,
        command,
        timestamp: Date.now()
    });
    console.log(`📤 Sending Control to Device: ${payload}`);
    client.publish(TOPIC_CONTROL, payload);
    return true;
}


/**
 * Get the latest received data
 */
function getLatestData() {
    return latestData;
}

module.exports = {
    init,
    publishControl,
    getLatestData
};
