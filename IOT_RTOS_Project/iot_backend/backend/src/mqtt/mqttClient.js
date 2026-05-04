const mqtt = require('mqtt');
require('dotenv').config();

// Configuration
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_DATA = 'iot/sensor/data';
const TOPIC_CONTROL = 'iot/device/control';


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
                    device_id: 'esp32_device', 
                    temperature: rawData.temperature,
                    humidity: rawData.humidity,
                    timestamp: new Date().toISOString()
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
function publishControl(state) {
    if (!client || !client.connected) {
        console.error('✗ Cannot publish: MQTT client not connected');
        return false;
    }

    const payload = JSON.stringify({ led: state });
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

