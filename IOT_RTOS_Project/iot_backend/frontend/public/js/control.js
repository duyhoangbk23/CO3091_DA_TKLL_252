/**
 * Control Page Script
 * Device control and command management
 */

let commandHistory = [];
const MAX_HISTORY_ITEMS = 20;

/**
 * Initialize control page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Control page initialized');
    updateFooterTime();
    setupEventListeners();
    setInterval(updateFooterTime, 1000);
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('command-form');
    form.addEventListener('submit', handleFormSubmit);

    // Load settings from localStorage if available
    loadSettings();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const deviceId = document.getElementById('device-select').value;
    const command = document.getElementById('command-select').value;

    if (!command) {
        alert('Please select a command');
        return;
    }

    await sendCommand(deviceId, command);
}

/**
 * Send command to device
 */
async function sendCommand(deviceId, command) {
    try {
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // Send command via API
        const result = await sendControlCommand(deviceId, command);

        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (result.success) {
            // Display success response
            displayResponse(result, true);
            
            // Add to command history
            addToHistory(deviceId, command, 'success', result.message);
            
            // Reset form
            document.getElementById('command-form').reset();
        } else {
            // Display error response
            displayResponse(result, false);
            addToHistory(deviceId, command, 'error', result.error);
        }
    } catch (error) {
        console.error('Error sending command:', error);
        displayResponse({
            success: false,
            error: 'Failed to send command: ' + error.message
        }, false);
    }
}

/**
 * Send quick command
 */
async function sendQuickCommand(command) {
    const deviceId = document.getElementById('device-select').value;
    await sendCommand(deviceId, command);
}

/**
 * Display response message
 */
function displayResponse(result, isSuccess) {
    const container = document.getElementById('response-container');
    const alert = document.getElementById('response-alert');
    const text = document.getElementById('response-text');

    if (isSuccess) {
        alert.className = 'alert alert-success';
        text.textContent = result.message || 'Command executed successfully';
    } else {
        alert.className = 'alert alert-danger';
        text.textContent = result.error || 'Failed to execute command';
    }

    container.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

/**
 * Add command to history
 */
function addToHistory(deviceId, command, status, message) {
    const timestamp = new Date().toLocaleTimeString();
    
    const historyItem = {
        timestamp: timestamp,
        deviceId: deviceId,
        command: command,
        status: status,
        message: message
    };

    commandHistory.unshift(historyItem);

    // Keep only last MAX_HISTORY_ITEMS
    if (commandHistory.length > MAX_HISTORY_ITEMS) {
        commandHistory.pop();
    }

    updateHistoryDisplay();
}

/**
 * Update command history display
 */
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('command-history');
    
    if (commandHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">No commands sent yet</p>';
        return;
    }

    let html = '';
    commandHistory.forEach((item, index) => {
        const statusBadge = item.status === 'success' 
            ? '<span class="badge bg-success">Success</span>'
            : '<span class="badge bg-danger">Error</span>';
        
        html += `
            <div class="border-bottom pb-2 mb-2">
                <small class="text-muted">${item.timestamp}</small>
                <p class="mb-1">
                    <strong>${item.deviceId}</strong> → <code>${item.command}</code>
                    ${statusBadge}
                </p>
                <small class="text-muted">${item.message}</small>
            </div>
        `;
    });

    historyContainer.innerHTML = html;
    
    // Update queue count
    document.getElementById('queue-count').textContent = commandHistory.length;
}

/**
 * Clear command history
 */
function clearHistory() {
    if (confirm('Are you sure you want to clear the command history?')) {
        commandHistory = [];
        updateHistoryDisplay();
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    const samplingRate = document.getElementById('sampling-rate').value;
    const alertTemp = document.getElementById('alert-temp').value;
    const alertHumidity = document.getElementById('alert-humidity').value;

    const settings = {
        samplingRate: samplingRate,
        alertTemp: alertTemp,
        alertHumidity: alertHumidity
    };

    localStorage.setItem('iotSettings', JSON.stringify(settings));
    
    // Show confirmation
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const saved = localStorage.getItem('iotSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('sampling-rate').value = settings.samplingRate;
        document.getElementById('alert-temp').value = settings.alertTemp;
        document.getElementById('alert-humidity').value = settings.alertHumidity;
    }
}

/**
 * Update footer time
 */
function updateFooterTime() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleString();
}

/**
 * Update last update time when page loads
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
});
