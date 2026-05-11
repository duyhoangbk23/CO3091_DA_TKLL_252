const mqtt = require('mqtt');
require('dotenv').config();

// Configuration
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = process.env.MQTT_TOPIC_DATA || process.env.MQTT_TOPIC_PUBLISH || 'iot/sensor/data';
const TOPIC_CONTROL = process.env.MQTT_TOPIC_COMMAND || 'iot/device/control';


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
        client.subscribe(TOPIC_DATA, (err) => {
            if (!err) {
                console.log(`✓ Subscribed to topic: ${TOPIC_DATA}`);
            }
        });
    });


    client.on('message', (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            console.log(`📩 MQTT Message [${topic}]:`, rawData);

            if (topic === TOPIC_DATA) {
                // New Protocol Format: { temperature, humidity }
                const mappedData = {
                    device_id: rawData.device_id || 'esp32_device', 
                    temperature: rawData.temperature,
                    humidity: rawData.humidity,
                    air_quality: rawData.air_quality || 0,
                    alert_level: rawData.alert_level || 0,
                    timestamp: parseInt(rawData.timestamp_ms || rawData.timestamp, 10) || Date.now()
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
