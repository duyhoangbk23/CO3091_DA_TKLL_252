const mqtt = require('mqtt');
require('dotenv').config();

// Configuration
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = 'sensor/esp32/data';
const TOPIC_STATUS = 'sensor/esp32/status';
const TOPIC_COMMAND = 'sensor/esp32/command';

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
        client.subscribe([TOPIC_DATA, TOPIC_STATUS], (err) => {
            if (!err) {
                console.log(`✓ Subscribed to topics: ${TOPIC_DATA}, ${TOPIC_STATUS}`);
            }
        });
    });

    client.on('message', (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            console.log(`📩 MQTT Message [${topic}]:`, rawData);

            if (topic === TOPIC_DATA || (topic === TOPIC_STATUS && rawData.type === 'status_report')) {
                // Map RTOS format -> Internal backend format
                // RTOS: { temp, humi, aqi, alert, ts }
                // Internal: { temperature, humidity, air_quality, alert_level, timestamp, device_id }
                
                const mappedData = {
                    device_id: 'esp32_sensor_001', // Fixed ID for now as per RTOS behavior
                    temperature: rawData.temp,
                    humidity: rawData.humi,
                    air_quality: rawData.aqi,
                    alert_level: rawData.alert || 0,
                    timestamp: new Date().toISOString() // Use server time for database consistency
                };

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
 * Publish control command to RTOS
 * @param {string} command Plain text command (e.g., 'LED_RED_ON')
 */
function publishCommand(command) {
    if (!client || !client.connected) {
        console.error('✗ Cannot publish: MQTT client not connected');
        return false;
    }

    console.log(`📤 Sending Command to RTOS: [${command}]`);
    client.publish(TOPIC_COMMAND, command);
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
    publishCommand,
    getLatestData
};
