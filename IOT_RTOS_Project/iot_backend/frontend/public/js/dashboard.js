/**
 * Dashboard Page Script
 * Real-time sensor data display
 */

let refreshInterval = null;
let isConnected = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    updateFooterTime();
    checkServerConnection();
    refreshData();

    refreshInterval = setInterval(refreshData, 2000);
    setInterval(updateFooterTime, 1000);
});

async function refreshData() {
    const data = await fetchLatestData();

    if (data) {
        isConnected = true;
        updateConnectionStatus(true);
        updateDashboard(data);
    } else {
        isConnected = false;
        updateConnectionStatus(false);
    }
}

function updateDashboard(data) {
    document.getElementById('device-id').textContent = data.device_id || '-';
    document.getElementById('device-status').textContent = data.status || 'unknown';
    document.getElementById('device-status').className =
        data.status === 'online' ? 'badge bg-success' : 'badge bg-danger';

    const tempValue = formatValue(data.temperature, 1);
    const humidityValue = formatValue(data.humidity, 1);
    const pm25Value = Number.parseInt(data.pm25, 10) || 0;
    const alertLevelValue = Number.parseInt(data.alert_level, 10) || 0;

    document.getElementById('temperature-value').textContent = tempValue + ' C';
    document.getElementById('humidity-value').textContent = humidityValue + '% RH';
    document.getElementById('air-quality-value').textContent = pm25Value;
    document.getElementById('alert-level-value').textContent = alertLevelValue;

    document.getElementById('temp-status').textContent = getTempStatus(data.temperature);
    document.getElementById('humidity-status').textContent = getHumidityStatus(data.humidity);
    document.getElementById('air-quality-status').textContent = getAirQualityStatus(pm25Value);
    document.getElementById('alert-level-status').textContent = getAlertStatus(alertLevelValue);

    const receivedAt = data.received_at || new Date().toISOString();
    document.getElementById('last-update').textContent = formatTimestamp(receivedAt);
    document.getElementById('connection-time').textContent = formatTimestamp(receivedAt);
    document.getElementById('device-timestamp').textContent = data.timestamp_ms || '-';

    animateSensorUpdate();
}

function getTempStatus(temp) {
    if (temp < 0) return 'Cold';
    if (temp < 20) return 'Cool';
    if (temp < 30) return 'Normal';
    if (temp < 40) return 'Warm';
    return 'Hot';
}

function getHumidityStatus(humidity) {
    if (humidity < 30) return 'Dry';
    if (humidity < 50) return 'Normal';
    if (humidity < 70) return 'Humid';
    return 'Very Humid';
}

function getAirQualityStatus(airQuality) {
    if (airQuality <= 300) return 'Normal';
    if (airQuality <= 500) return 'Warning';
    return 'Critical';
}

function getAlertStatus(alertLevel) {
    if (alertLevel === 0) return 'OK';
    if (alertLevel === 1) return 'Warning';
    return 'Critical';
}

function updateConnectionStatus(connected) {
    const statusBadge = document.getElementById('connection-status');
    if (connected) {
        statusBadge.className = 'badge bg-success';
        statusBadge.textContent = 'Connected';
    } else {
        statusBadge.className = 'badge bg-danger';
        statusBadge.textContent = 'Disconnected';
    }
}

async function checkServerConnection() {
    const isHealthy = await checkHealth();
    updateConnectionStatus(isHealthy);
}

function animateSensorUpdate() {
    const cards = document.querySelectorAll('.sensor-card');
    cards.forEach(card => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.3s ease-in-out';
        }, 10);
    });
}

function updateFooterTime() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleString();
}

window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
