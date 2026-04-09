/**
 * Dashboard Page Script
 * Real-time sensor data display
 */

let refreshInterval = null;
let isConnected = false;

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    updateFooterTime();
    checkServerConnection();
    refreshData();
    
    // Set up auto-refresh every 2 seconds
    refreshInterval = setInterval(refreshData, 2000);
    
    // Update footer time every second
    setInterval(updateFooterTime, 1000);
});

/**
 * Refresh sensor data from API
 */
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

/**
 * Update dashboard display with sensor data
 */
function updateDashboard(data) {
    // Update device information
    document.getElementById('device-id').textContent = data.device_id || '-';
    document.getElementById('device-status').textContent = data.status || 'unknown';
    document.getElementById('device-status').className = 
        data.status === 'online' ? 'badge bg-success' : 'badge bg-danger';
    
    // Update sensor readings
    const tempValue = formatValue(data.temperature, 1);
    const humidityValue = formatValue(data.humidity, 1);
    
    document.getElementById('temperature-value').textContent = tempValue + '°C';
    document.getElementById('humidity-value').textContent = humidityValue + '% RH';
    
    // Update status badges
    document.getElementById('temp-status').textContent = getTempStatus(data.temperature);
    document.getElementById('humidity-status').textContent = getHumidityStatus(data.humidity);
    
    // Update last update time
    const lastUpdate = new Date(data.timestamp).toLocaleTimeString();
    document.getElementById('last-update').textContent = lastUpdate;
    
    // Update connection time (formatted)
    document.getElementById('connection-time').textContent = formatTimestamp(data.timestamp);
    
    // Add animation effect
    animateSensorUpdate();
}

/**
 * Get temperature status based on value
 */
function getTempStatus(temp) {
    if (temp < 0) return 'Cold';
    if (temp < 20) return 'Cool';
    if (temp < 30) return 'Normal';
    if (temp < 40) return 'Warm';
    return 'Hot';
}

/**
 * Get humidity status based on value
 */
function getHumidityStatus(humidity) {
    if (humidity < 30) return 'Dry';
    if (humidity < 50) return 'Normal';
    if (humidity < 70) return 'Humid';
    return 'Very Humid';
}

/**
 * Update connection status display
 */
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

/**
 * Check if server is running
 */
async function checkServerConnection() {
    const isHealthy = await checkHealth();
    updateConnectionStatus(isHealthy);
}

/**
 * Animate sensor card updates
 */
function animateSensorUpdate() {
    const cards = document.querySelectorAll('.sensor-card');
    cards.forEach(card => {
        card.style.animation = 'none';
        // Trigger reflow to restart animation
        setTimeout(() => {
            card.style.animation = 'pulse 0.3s ease-in-out';
        }, 10);
    });
}

/**
 * Update footer time
 */
function updateFooterTime() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleString();
}

/**
 * Manual refresh button handler
 */
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
