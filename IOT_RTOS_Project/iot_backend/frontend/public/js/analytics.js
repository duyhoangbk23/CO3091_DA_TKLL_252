/**
 * Analytics Page Script
 * Historical data visualization and analysis
 */

let temperatureChart = null;
let humidityChart = null;
let allData = [];

/**
 * Initialize analytics page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Analytics page initialized');
    updateFooterTime();
    initializeCharts();
    setInterval(updateFooterTime, 1000);
});

/**
 * Initialize Chart.js charts
 */
function initializeCharts() {
    const tempCtx = document.getElementById('temperature-chart').getContext('2d');
    const humidityCtx = document.getElementById('humidity-chart').getContext('2d');

    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '°C'
                    }
                }
            }
        }
    });

    humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (% RH)',
                data: [],
                borderColor: '#0dcaf0',
                backgroundColor: 'rgba(13, 202, 240, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: '% RH'
                    }
                }
            }
        }
    });
}

/**
 * Load historical data
 */
async function loadHistory() {
    const limit = parseInt(document.getElementById('data-limit').value);
    const hours = parseInt(document.getElementById('time-range').value);

    // Show loading state
    document.getElementById('stat-records').textContent = 'Loading...';
    
    allData = await fetchHistoricalData(limit, hours);

    if (allData.length === 0) {
        alert('No data available for the selected criteria');
        document.getElementById('stat-records').textContent = '0';
        return;
    }

    // Update statistics
    updateStatistics(allData);

    // Update charts
    updateCharts(allData);

    // Update table
    updateDataTable(allData);
}

/**
 * Update statistics display
 */
function updateStatistics(data) {
    if (data.length === 0) return;

    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);

    const avgTemp = (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1);
    const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);

    document.getElementById('stat-avg-temp').textContent = avgTemp;
    document.getElementById('stat-avg-humidity').textContent = avgHumidity;
    document.getElementById('stat-records').textContent = data.length;
}

/**
 * Update chart data
 */
function updateCharts(data) {
    if (!temperatureChart || !humidityChart) return;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
    );

    const labels = sortedData.map(d => {
        const date = new Date(d.created_at);
        return date.toLocaleTimeString();
    });

    const temperatures = sortedData.map(d => d.temperature);
    const humidities = sortedData.map(d => d.humidity);

    // Update temperature chart
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temperatures;
    temperatureChart.update();

    // Update humidity chart
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = humidities;
    humidityChart.update();
}

/**
 * Update data table
 */
function updateDataTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // Sort by date descending (newest first)
    const sortedData = [...data].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );

    sortedData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTimestamp(row.created_at)}</td>
            <td>${row.device_id}</td>
            <td><strong>${formatValue(row.temperature, 1)}°C</strong></td>
            <td><strong>${formatValue(row.humidity, 1)}% RH</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Export data to CSV
 */
function exportToCsv() {
    if (allData.length === 0) {
        alert('No data to export. Load data first.');
        return;
    }

    let csv = 'Timestamp,Device ID,Temperature (°C),Humidity (% RH)\n';

    allData.forEach(row => {
        const timestamp = formatTimestamp(row.created_at);
        csv += `"${timestamp}","${row.device_id}",${row.temperature},${row.humidity}\n`;
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor_data_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('CSV exported successfully');
}

/**
 * Update footer time
 */
function updateFooterTime() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleString();
}
