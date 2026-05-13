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
        const response = await fetch(
            `${API_BASE_URL}/history?limit=${limit}&hours=${hours}`
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
    return parseFloat(value).toFixed(decimals);
}
