/**
 * Analytics Page Script
 * Historical data visualization and analysis
 */

let temperatureChart = null;
let humidityChart = null;
let allData = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Analytics page initialized');
    updateFooterTime();
    initializeCharts();
    setInterval(updateFooterTime, 1000);
});

function initializeCharts() {
    const tempCtx = document.getElementById('temperature-chart').getContext('2d');
    const humidityCtx = document.getElementById('humidity-chart').getContext('2d');

    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (C)',
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
            plugins: { legend: { display: true, position: 'top' } },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'C' }
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
            plugins: { legend: { display: true, position: 'top' } },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: '% RH' }
                }
            }
        }
    });
}

async function loadHistory() {
    const limit = parseInt(document.getElementById('data-limit').value);
    const hours = parseInt(document.getElementById('time-range').value);

    document.getElementById('stat-records').textContent = 'Loading...';

    allData = await fetchHistoricalData(limit, hours);

    if (allData.length === 0) {
        alert('No data available for the selected criteria');
        document.getElementById('stat-records').textContent = '0';
        return;
    }

    updateStatistics(allData);
    updateCharts(allData);
    updateDataTable(allData);
}

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

function updateCharts(data) {
    if (!temperatureChart || !humidityChart) return;

    const sortedData = [...data].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
    );

    const labels = sortedData.map(d => {
        const date = new Date(d.created_at);
        return date.toLocaleTimeString();
    });

    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = sortedData.map(d => d.temperature);
    temperatureChart.update();

    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = sortedData.map(d => d.humidity);
    humidityChart.update();
}

function updateDataTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    const sortedData = [...data].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    sortedData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTimestamp(row.created_at)}</td>
            <td>${row.device_id}</td>
            <td><strong>${formatValue(row.temperature, 1)} C</strong></td>
            <td><strong>${formatValue(row.humidity, 1)}% RH</strong></td>
            <td>${row.air_quality ?? 0}</td>
            <td>${row.alert_level ?? 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportToCsv() {
    if (allData.length === 0) {
        alert('No data to export. Load data first.');
        return;
    }

    let csv = 'Timestamp,Device ID,Temperature (C),Humidity (% RH),Air Quality,Alert Level,Device Timestamp (ms)\n';

    allData.forEach(row => {
        const timestamp = formatTimestamp(row.created_at);
        csv += `"${timestamp}","${row.device_id}",${row.temperature},${row.humidity},${row.air_quality ?? 0},${row.alert_level ?? 0},${row.timestamp_ms ?? ''}\n`;
    });

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

function updateFooterTime() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleString();
}
