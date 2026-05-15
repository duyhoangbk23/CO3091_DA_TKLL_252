/**
 * API Service Module
 * Handles all backend API calls
 */

const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:3000/api'
    : '/api';
const HEALTH_URL = window.location.protocol === 'file:'
    ? 'http://localhost:3000/health'
    : '/health';
const DEFAULT_DEVICE_ID = '';

/**
 * Fetch latest sensor data
 */
async function fetchLatestData() {
    try {
        const response = await fetch(`${API_BASE_URL}/data`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return {
            ...result.data,
            received_at: result.data.received_at || result.timestamp
        };
    } catch (error) {
        console.error('Error fetching latest data:', error);
        return null;
    }
}

/**
 * Fetch historical data from database
 * @param {number} limit - Number of records to fetch
 * @param {number} hours - Time range in hours
 */
async function fetchHistoricalData(limit = 100, hours = 24) {
    try {
        const cappedLimit = Math.min(Number(limit) || 20, 20);
        const response = await fetch(
            `${API_BASE_URL}/history?limit=${cappedLimit}&hours=${hours}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

async function exportSensorCsv(hours = 24) {
    try {
        const response = await fetch(`${API_BASE_URL}/export.csv?hours=${encodeURIComponent(hours)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.blob();
    } catch (error) {
        console.error('Error exporting CSV:', error);
        throw error;
    }
}

/**
 * Send control command to device
 * @param {string} deviceId - Device ID
 * @param {string} command - Command to send (ON, OFF, RESET, CALIBRATE)
 */
async function sendControlCommand(deviceId, command) {
    try {
        const response = await fetch(`${API_BASE_URL}/control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId,
                command: command.toUpperCase()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending command:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function postJson(path, body) {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
        return result;
    } catch (error) {
        console.error(`API ${path} failed:`, error);
        return { success: false, error: error.message };
    }
}

async function setAutoControl(deviceId, enabled) {
    return postJson('/control/auto', { device_id: deviceId, enabled });
}

async function setDeviceState(deviceId, device, state) {
    return postJson('/control/device', { device_id: deviceId, device, state });
}

async function requestThresholdConfig(deviceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/control/thresholds?device_id=${encodeURIComponent(deviceId)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
        return result;
    } catch (error) {
        console.error('Error requesting thresholds:', error);
        return { success: false, error: error.message };
    }
}

async function updateThresholdConfig(deviceId, thresholds) {
    return postJson('/control/thresholds', { device_id: deviceId, thresholds });
}

/**
 * Fetch statistics
 */
async function fetchStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return null;
    }
}

/**
 * Fetch control history
 */
async function fetchControlHistory(limit = 20) {
    try {
        const response = await fetch(`${API_BASE_URL}/control/history?limit=${limit}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching control history:', error);
        return [];
    }
}

/**
 * Check server health
 */
async function checkHealth() {
    try {
        const response = await fetch(HEALTH_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.status === 'ok';
    } catch (error) {
        console.error('Server not available:', error);
        return false;
    }
}

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
}

/**
 * Format sensor value to specified decimal places
 */
function formatValue(value, decimals = 1) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n.toFixed(decimals) : '--';
}
