let refreshInterval = null;
let previousCleanData = {};
let lastNoiseAt = 0;
let lastNoiseMetric = '';

const DASHBOARD_NOISE_CONFIG = {
    temperature: { maxDelta: 5, label: 'Temperature' },
    humidity: { maxDelta: 15, label: 'Humidity' },
    pm25: { maxDelta: 40, label: 'PM2.5' },
    co2: { maxDelta: 700, label: 'CO2' },
    voc: { maxDelta: 700, label: 'VOC' }
};

document.addEventListener('DOMContentLoaded', () => {
    updateFooterTime();
    checkServerConnection();
    refreshData();

    refreshInterval = setInterval(refreshData, 2000);
    setInterval(updateNoiseAlert, 1000);
    setInterval(updateFooterTime, 1000);
});

async function refreshData() {
    const data = await fetchLatestData();
    if (data) {
        updateConnectionStatus(data.status === 'online');
        updateDashboard(data);
    } else {
        updateConnectionStatus(false);
    }
}

function updateDashboard(data) {
    if (data.status !== 'online') {
        updateOfflineDashboard(data);
        return;
    }

    data = filterDashboardNoise(data);
    document.getElementById('device-id').textContent = data.device_id || '-';
    document.getElementById('device-status').textContent = data.status || 'unknown';
    document.getElementById('device-status').className =
        data.status === 'online' ? 'badge bg-success' : 'badge bg-danger';

    const health = data.sensor_health || {};
    const tempValue = formatValue(data.temperature, 1);
    const humidityValue = formatValue(data.humidity, 1);
    const pm25Value = Number.parseInt(data.pm25, 10) || 0;
    const co2Value = Number.parseInt(data.co2, 10) || 0;
    const vocValue = Number.parseInt(data.voc, 10) || 0;

    document.getElementById('temperature-value').textContent = `${tempValue} C`;
    document.getElementById('humidity-value').textContent = `${humidityValue}% RH`;
    document.getElementById('pm25-value').textContent = `${pm25Value} ug/m3`;
    document.getElementById('co2-value').textContent = `${co2Value} ppm`;
    document.getElementById('voc-value').textContent = `${vocValue} index`;

    setHealthBadge('temp-status', health.temp, getTempStatus(data.temperature));
    setHealthBadge('humidity-status', health.rh, getHumidityStatus(data.humidity));
    setHealthBadge('pm25-status', health.pm, getPm25Status(pm25Value));
    setHealthBadge('co2-status', health.co2, getCo2Status(co2Value));
    setHealthBadge('voc-status', health.voc, getVocStatus(vocValue));

    const receivedAt = data.received_at || new Date().toISOString();
    document.getElementById('last-update').textContent = formatTimestamp(receivedAt);
    document.getElementById('connection-time').textContent = formatTimestamp(receivedAt);
    document.getElementById('device-timestamp').textContent = data.timestamp_ms || '-';

    animateSensorUpdate();
}

function updateOfflineDashboard(data) {
    previousCleanData = {};
    document.getElementById('device-id').textContent = data.device_id || '-';
    document.getElementById('device-status').textContent = 'offline';
    document.getElementById('device-status').className = 'badge bg-danger';

    document.getElementById('temperature-value').textContent = '--';
    document.getElementById('humidity-value').textContent = '--';
    document.getElementById('pm25-value').textContent = '--';
    document.getElementById('co2-value').textContent = '--';
    document.getElementById('voc-value').textContent = '--';

    setHealthBadge('temp-status', 'MISSING', 'MISSING');
    setHealthBadge('humidity-status', 'MISSING', 'MISSING');
    setHealthBadge('pm25-status', 'MISSING', 'MISSING');
    setHealthBadge('co2-status', 'MISSING', 'MISSING');
    setHealthBadge('voc-status', 'MISSING', 'MISSING');

    document.getElementById('last-update').textContent = data.received_at ? formatTimestamp(data.received_at) : '-';
    document.getElementById('connection-time').textContent = '-';
    document.getElementById('device-timestamp').textContent = '-';
}

function filterDashboardNoise(data) {
    const next = { ...data };
    Object.entries(DASHBOARD_NOISE_CONFIG).forEach(([metric, config]) => {
        const value = Number(data[metric]);
        const previous = Number(previousCleanData[metric]);
        if (Number.isFinite(value) && Number.isFinite(previous) && Math.abs(value - previous) > config.maxDelta) {
            next[metric] = previous;
            lastNoiseAt = Date.now();
            lastNoiseMetric = config.label;
        } else if (Number.isFinite(value)) {
            previousCleanData[metric] = value;
        }
    });
    return next;
}

function updateNoiseAlert() {
    const alert = document.getElementById('noise-alert');
    if (!alert) return;
    if (!lastNoiseAt || Date.now() - lastNoiseAt > 30000) {
        alert.style.display = 'none';
        alert.textContent = '';
        return;
    }
    const seconds = Math.floor((Date.now() - lastNoiseAt) / 1000);
    alert.style.display = 'block';
    alert.textContent = `Noise detected on ${lastNoiseMetric} ${seconds} seconds ago. The dashboard is holding the previous valid value.`;
}

function setHealthBadge(id, health, fallback) {
    const el = document.getElementById(id);
    if (!el) return;
    if (health && health !== 'OK') {
        el.textContent = health;
        el.className = 'badge bg-danger';
    } else {
        el.textContent = fallback;
        el.className = 'badge bg-info';
    }
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

function getPm25Status(pm25) {
    if (pm25 <= 35) return 'Normal';
    if (pm25 <= 75) return 'Moderate';
    return 'Poor';
}

function getCo2Status(co2) {
    if (co2 < 600) return 'Good';
    if (co2 < 1000) return 'Moderate';
    return 'High';
}

function getVocStatus(voc) {
    if (voc < 200) return 'Normal';
    if (voc < 400) return 'Elevated';
    return 'High';
}

function updateConnectionStatus(connected) {
    const statusBadge = document.getElementById('connection-status');
    if (!statusBadge) return;
    statusBadge.className = connected ? 'badge bg-success' : 'badge bg-danger';
    statusBadge.textContent = connected ? 'Connected' : 'Disconnected';
}

async function checkServerConnection() {
    const isHealthy = await checkHealth();
    updateConnectionStatus(isHealthy);
}

function animateSensorUpdate() {
    document.querySelectorAll('.sensor-card').forEach(card => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.3s ease-in-out';
        }, 10);
    });
}

function updateFooterTime() {
    document.getElementById('footer-time').textContent = new Date().toLocaleString();
}

window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
});
