let commandHistory = [];
const MAX_HISTORY_ITEMS = 20;
let sensorRefreshInterval = null;
let historyRefreshInterval = null;
let pendingCommand = null;

const DEVICES = [
    { key: 'vent', label: 'Ventilation', icon: 'fa-fan', description: 'Exhaust and fresh air fan' },
    { key: 'hepa', label: 'PM Filter', icon: 'fa-filter', description: 'Fine dust filtration' },
    { key: 'carbon', label: 'CO2 Filter', icon: 'fa-cloud', description: 'CO2 reduction assist' },
    { key: 'ac', label: 'Air Conditioner', icon: 'fa-snowflake', description: 'Temperature control' },
    { key: 'humid', label: 'Humidifier', icon: 'fa-droplet', description: 'Humidity control' }
];

let latestDeviceState = {};
let autoControlEnabled = true;
let lastAckKey = '';

document.addEventListener('DOMContentLoaded', () => {
    updateFooterTime();
    setupEventListeners();
    renderDeviceControls();
    enableDraggablePanels();
    loadSensorData();
    loadControlHistory();

    sensorRefreshInterval = setInterval(loadSensorData, 2000);
    historyRefreshInterval = setInterval(loadControlHistory, 10000);
    setInterval(updateFooterTime, 1000);
});

function setupEventListeners() {
    document.getElementById('auto-control-switch').addEventListener('change', handleAutoToggle);
    document.getElementById('threshold-form').addEventListener('submit', saveThresholdsToFirmware);
    document.getElementById('load-thresholds-btn').addEventListener('click', requestThresholdsFromFirmware);
}

function renderDeviceControls() {
    const grid = document.getElementById('device-control-grid');
    if (!grid.querySelector('.device-card')) {
        grid.innerHTML = DEVICES.map(device => `
        <div class="device-card" id="device-card-${device.key}">
            <div class="device-icon"><i class="fas ${device.icon}"></i></div>
            <div class="device-copy">
                <div class="d-flex align-items-center justify-content-between gap-2">
                    <h6 class="mb-0">${device.label}</h6>
                    <span id="device-${device.key}-state" class="badge bg-secondary">OFF</span>
                </div>
                <p class="small text-muted mb-1">${device.description}</p>
                <span class="small" id="device-${device.key}-pending">Ready</span>
            </div>
            <div class="form-check form-switch m-0">
                <input class="form-check-input manual-device-toggle" type="checkbox" id="device-${device.key}-toggle" data-device="${device.key}">
            </div>
        </div>
        `).join('');
    }

    document.querySelectorAll('.manual-device-toggle').forEach(toggle => {
        toggle.addEventListener('change', handleDeviceToggle);
    });
}

async function handleAutoToggle(e) {
    const desired = e.target.checked;
    e.target.checked = autoControlEnabled;
    pendingCommand = { command: 'SET_AUTO', desired, startedAt: Date.now() };
    setAutoUiPending(true);
    const result = await setAutoControl(getDeviceId(), desired);
    addToHistory(getDeviceId(), 'SET_AUTO', result.success ? 'sent' : 'error', result.message || result.error);
    displayResponse(result, result.success);
    if (!result.success) {
        pendingCommand = null;
        setAutoUiPending(false);
        e.target.checked = autoControlEnabled;
    }
}

async function handleDeviceToggle(e) {
    const toggle = e.target;
    const device = toggle.dataset.device;
    const desired = toggle.checked;
    toggle.checked = Boolean(latestDeviceState[device]);
    pendingCommand = { command: 'SET_DEVICE', device, desired, startedAt: Date.now() };
    setDevicePending(device, true);
    const result = await setDeviceState(getDeviceId(), device, desired);
    addToHistory(getDeviceId(), `SET_DEVICE ${device}`, result.success ? 'sent' : 'error', result.message || result.error);
    displayResponse(result, result.success);
    if (!result.success) {
        pendingCommand = null;
        setDevicePending(device, false);
        toggle.checked = Boolean(latestDeviceState[device]);
    }
}

async function loadSensorData() {
    clearExpiredPendingCommand();
    const data = await fetchLatestData();
    if (!data) return;

    document.getElementById('last-update').textContent = formatTimestamp(data.received_at || data.timestamp);
    document.getElementById('device-status').textContent = data.status || 'unknown';
    document.getElementById('device-status').className = data.status === 'online' ? 'badge bg-success' : 'badge bg-danger';

    autoControlEnabled = data.auto_control_enabled !== false;
    latestDeviceState = data.devices || latestDeviceState;
    handleAck(data.ack);
    updateDeviceControls();
    updateSensorSection(data);
}

function clearExpiredPendingCommand() {
    if (!pendingCommand || Date.now() - pendingCommand.startedAt < 10000) return;
    const expired = pendingCommand;
    pendingCommand = null;
    setAutoUiPending(false);
    DEVICES.forEach(device => setDevicePending(device.key, false));
    if (expired.command === 'SET_THRESHOLDS' || expired.command === 'GET_THRESHOLDS') {
        setThresholdStatus('ESP32 ACK timeout. Check MQTT/firmware connection.', false);
    }
    displayResponse({ error: 'ESP32 ACK timeout. State was not changed on the UI.' }, false);
}

function handleAck(ack) {
    if (!ack) return;
    const ackKey = `${ack.command_id || ''}:${ack.command || ''}:${ack.status}:${ack.message || ''}`;
    if (ackKey === lastAckKey) return;
    lastAckKey = ackKey;

    const ok = ack.status === 'success';
    displayResponse({ success: ok, message: ack.message || `${ack.command} acknowledged`, error: ack.message }, ok);

    if (ack.command === 'SET_THRESHOLDS') {
        setThresholdStatus(ok ? 'Firmware thresholds saved.' : `Firmware rejected config: ${ack.message || 'validation failed'}`, ok);
    }
    if (ack.command === 'GET_THRESHOLDS') {
        setThresholdStatus(ok ? 'Firmware thresholds loaded.' : `Load failed: ${ack.message || 'firmware error'}`, ok);
        if (ack.thresholds) fillThresholdForm(ack.thresholds);
    }

    if (pendingCommand && ack.command === pendingCommand.command) {
        pendingCommand = null;
        setAutoUiPending(false);
        DEVICES.forEach(device => setDevicePending(device.key, false));
    }
}

function updateDeviceControls() {
    const autoSwitch = document.getElementById('auto-control-switch');
    if (!pendingCommand || pendingCommand.command !== 'SET_AUTO') autoSwitch.checked = autoControlEnabled;
    autoSwitch.disabled = pendingCommand?.command === 'SET_AUTO';

    document.getElementById('auto-control-note').textContent = autoControlEnabled
        ? 'Auto mode is active. Firmware controls devices and manual toggles are locked.'
        : 'Manual mode is active. Device toggles change only after ESP32 ACK.';

    DEVICES.forEach(device => {
        const on = Boolean(latestDeviceState[device.key]);
        const badge = document.getElementById(`device-${device.key}-state`);
        const toggle = document.getElementById(`device-${device.key}-toggle`);
        const card = document.getElementById(`device-card-${device.key}`);
        if (!badge || !toggle || !card) return;

        if (!pendingCommand || pendingCommand.device !== device.key) toggle.checked = on;
        toggle.disabled = autoControlEnabled || Boolean(pendingCommand);
        badge.textContent = on ? 'ON' : 'OFF';
        badge.className = on ? 'badge bg-success' : 'badge bg-secondary';
        card.classList.toggle('device-on', on);
        card.classList.toggle('device-locked', autoControlEnabled);
    });
}

function setAutoUiPending(isPending) {
    const note = document.getElementById('auto-control-note');
    if (isPending) note.textContent = 'Waiting for ESP32 confirmation...';
}

function setDevicePending(device, isPending) {
    const label = document.getElementById(`device-${device}-pending`);
    const toggle = document.getElementById(`device-${device}-toggle`);
    if (!label || !toggle) return;
    label.textContent = isPending ? 'Waiting for ESP32 ACK...' : 'Ready';
    toggle.disabled = isPending || autoControlEnabled;
}

function updateSensorSection(data) {
    const health = data.sensor_health || {};
    setCell('sensor-temp', formatMetric(data.temperature, ' C', 1));
    setCell('sensor-humidity', formatMetric(data.humidity, ' % RH', 1));
    setCell('sensor-pm25', formatMetric(data.pm25, ' ug/m3', 0));
    setCell('sensor-co2', formatMetric(data.co2, ' ppm', 0));
    setCell('sensor-voc', formatMetric(data.voc, '', 0));
    setStatusCell('sensor-temp-status', health.temp);
    setStatusCell('sensor-humidity-status', health.rh);
    setStatusCell('sensor-pm25-status', health.pm);
    setStatusCell('sensor-co2-status', health.co2);
    setStatusCell('sensor-voc-status', health.voc);
}

function formatMetric(value, unit, digits) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '--';
    return `${n.toFixed(digits)}${unit}`;
}

function setCell(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setStatusCell(id, health) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = health || 'MISSING';
    el.className = health === 'OK' ? 'text-success fw-bold' : 'text-danger fw-bold';
}

function readThresholdForm() {
    return {
        co2_on: Number(document.getElementById('th-co2-on').value),
        co2_off: Number(document.getElementById('th-co2-off').value),
        pm_on: Number(document.getElementById('th-pm-on').value),
        pm_off: Number(document.getElementById('th-pm-off').value),
        voc_on: Number(document.getElementById('th-voc-on').value),
        voc_off: Number(document.getElementById('th-voc-off').value),
        temp_on: Number(document.getElementById('th-temp-on').value),
        temp_off: Number(document.getElementById('th-temp-off').value),
        rh_low_on: Number(document.getElementById('th-rh-low-on').value),
        rh_low_off: Number(document.getElementById('th-rh-low-off').value),
        rh_high_on: Number(document.getElementById('th-rh-high-on').value),
        rh_high_off: Number(document.getElementById('th-rh-high-off').value)
    };
}

function fillThresholdForm(t) {
    const pairs = {
        'th-co2-on': t.co2_on, 'th-co2-off': t.co2_off,
        'th-pm-on': t.pm_on, 'th-pm-off': t.pm_off,
        'th-voc-on': t.voc_on, 'th-voc-off': t.voc_off,
        'th-temp-on': t.temp_on, 'th-temp-off': t.temp_off,
        'th-rh-low-on': t.rh_low_on, 'th-rh-low-off': t.rh_low_off,
        'th-rh-high-on': t.rh_high_on, 'th-rh-high-off': t.rh_high_off
    };
    Object.entries(pairs).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (value !== undefined && el) el.value = value;
    });
}

async function requestThresholdsFromFirmware() {
    pendingCommand = { command: 'GET_THRESHOLDS', startedAt: Date.now() };
    setThresholdStatus('Requesting firmware thresholds...', null);
    const result = await requestThresholdConfig(getDeviceId());
    setThresholdStatus(result.success ? 'Request sent. Waiting for ESP32 ACK...' : `Error: ${result.error}`, result.success ? null : false);
    if (!result.success) pendingCommand = null;
    addToHistory(getDeviceId(), 'GET_THRESHOLDS', result.success ? 'sent' : 'error', result.message || result.error);
}

async function saveThresholdsToFirmware(e) {
    e.preventDefault();
    pendingCommand = { command: 'SET_THRESHOLDS', startedAt: Date.now() };
    setThresholdStatus('Saving to firmware...', null);
    const result = await updateThresholdConfig(getDeviceId(), readThresholdForm());
    setThresholdStatus(result.success ? 'Config sent. Waiting for ESP32 ACK...' : `Error: ${result.error}`, result.success ? null : false);
    if (!result.success) pendingCommand = null;
    addToHistory(getDeviceId(), 'SET_THRESHOLDS', result.success ? 'sent' : 'error', result.message || result.error);
    displayResponse(result, result.success);
}

function setThresholdStatus(message, ok) {
    const status = document.getElementById('threshold-status');
    if (!status) return;
    status.textContent = message;
    status.className = ok === true
        ? 'small align-self-center text-success fw-bold'
        : ok === false
            ? 'small align-self-center text-danger fw-bold'
            : 'small align-self-center text-muted';
}

function addToHistory(deviceId, command, status, message) {
    commandHistory.unshift({
        timestamp: new Date().toLocaleTimeString(),
        deviceId,
        command,
        status,
        message
    });
    commandHistory = commandHistory.slice(0, MAX_HISTORY_ITEMS);
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('command-history');
    if (!historyContainer) return;
    if (commandHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">No commands sent yet</p>';
        return;
    }
    historyContainer.innerHTML = commandHistory.map(item => {
        const cls = item.status === 'error' ? 'bg-danger' : 'bg-success';
        return `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${item.timestamp}</small>
                <p class="mb-1"><strong>${item.deviceId}</strong> -> <code>${item.command}</code> <span class="badge ${cls}">${item.status}</span></p>
                <small class="text-muted">${item.message || ''}</small>
            </div>
        `;
    }).join('');
}

async function loadControlHistory(limit = 20) {
    const history = await fetchControlHistory(limit);
    if (!history || history.length === 0) {
        updateHistoryDisplay();
        return;
    }
    commandHistory = history.slice(0, MAX_HISTORY_ITEMS).map(item => ({
        timestamp: formatTimestamp(item.created_at),
        deviceId: item.device_id,
        command: item.command,
        status: item.status === 'sent' ? 'sent' : 'error',
        message: item.status === 'sent' ? 'Sent to firmware' : 'Failed'
    }));
    updateHistoryDisplay();
}

function displayResponse(result, isSuccess) {
    const container = document.getElementById('response-container');
    const alert = document.getElementById('response-alert');
    const text = document.getElementById('response-text');
    if (!container || !alert || !text) return;
    alert.className = isSuccess ? 'alert alert-success' : 'alert alert-danger';
    text.textContent = isSuccess ? (result.message || 'Command acknowledged') : (result.error || result.message || 'Command failed');
    container.style.display = 'block';
    setTimeout(() => { container.style.display = 'none'; }, 5000);
}

function getDeviceId() {
    return document.getElementById('device-select').value;
}

function enableDraggablePanels() {
    document.querySelectorAll('.draggable-panel').forEach(panel => {
        panel.addEventListener('dragstart', event => {
            event.dataTransfer.setData('text/plain', panel.id || 'history-panel');
        });
    });
}

function updateFooterTime() {
    document.getElementById('footer-time').textContent = new Date().toLocaleString();
}
