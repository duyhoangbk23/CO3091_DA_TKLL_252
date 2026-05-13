/**
 * Analytics Page Script
 * Historical data visualization and analysis
 */

let temperatureChart = null;
let humidityChart = null;
let pm25Chart = null;
let co2Chart = null;
let vocChart = null;
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

    const pm25Ctx = document.getElementById('pm25-chart').getContext('2d');
    const co2Ctx = document.getElementById('co2-chart').getContext('2d');
    const vocCtx = document.getElementById('voc-chart').getContext('2d');

    pm25Chart = new Chart(pm25Ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PM2.5 (µg/m³)',
                data: [],
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
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
                    beginAtZero: true,
                    title: { display: true, text: 'µg/m³' }
                }
            }
        }
    });

    co2Chart = new Chart(co2Ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CO₂ (ppm)',
                data: [],
                borderColor: '#6c757d',
                backgroundColor: 'rgba(108, 117, 125, 0.1)',
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
                    min: 400,
                    title: { display: true, text: 'ppm' }
                }
            }
        }
    });

    vocChart = new Chart(vocCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'VOC (ppb)',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
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
                    beginAtZero: true,
                    title: { display: true, text: 'ppb' }
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
    const pm25s = data.filter(d => d.pm25 != null && d.pm25 !== -1).map(d => d.pm25);
    const co2s = data.filter(d => d.co2 != null && d.co2 !== 65535 && d.co2 !== -1).map(d => d.co2);
    const vocs = data.filter(d => d.voc != null && d.voc !== -1).map(d => d.voc);

    const avgTemp = (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1);
    const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);
    const avgPm25 = pm25s.length > 0 ? (pm25s.reduce((a, b) => a + b, 0) / pm25s.length).toFixed(1) : '-';
    const avgCo2 = co2s.length > 0 ? (co2s.reduce((a, b) => a + b, 0) / co2s.length).toFixed(0) : '-';
    const avgVoc = vocs.length > 0 ? (vocs.reduce((a, b) => a + b, 0) / vocs.length).toFixed(0) : '-';

    document.getElementById('stat-avg-temp').textContent = avgTemp;
    document.getElementById('stat-avg-humidity').textContent = avgHumidity;
    document.getElementById('stat-avg-pm25').textContent = avgPm25;
    document.getElementById('stat-avg-co2').textContent = avgCo2;
    document.getElementById('stat-avg-voc').textContent = avgVoc;
    document.getElementById('stat-records').textContent = data.length;
}

function updateCharts(data) {
    if (!temperatureChart || !humidityChart || !pm25Chart || !co2Chart || !vocChart) return;

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

    pm25Chart.data.labels = labels;
    pm25Chart.data.datasets[0].data = sortedData.map(d => d.pm25 != null && d.pm25 !== -1 ? d.pm25 : null);
    pm25Chart.update();

    co2Chart.data.labels = labels;
    co2Chart.data.datasets[0].data = sortedData.map(d => d.co2 != null && d.co2 !== 65535 && d.co2 !== -1 ? d.co2 : null);
    co2Chart.update();

    vocChart.data.labels = labels;
    vocChart.data.datasets[0].data = sortedData.map(d => d.voc != null && d.voc !== -1 ? d.voc : null);
    vocChart.update();
}

function updateDataTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    const sortedData = [...data].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    sortedData.forEach(row => {
        const tr = document.createElement('tr');
        const pm = row.pm25 != null && row.pm25 !== -1 ? row.pm25 : (row.air_quality ?? '');
        const co2v = row.co2 != null && row.co2 !== 65535 && row.co2 !== -1 ? row.co2 : (row.co2 === 65535 ? '—' : row.co2 ?? '');
        const vocv = row.voc != null && row.voc !== -1 ? row.voc : '';
        tr.innerHTML = `
            <td>${formatTimestamp(row.created_at)}</td>
            <td>${row.device_id}</td>
            <td><strong>${formatValue(row.temperature, 1)} C</strong></td>
            <td><strong>${formatValue(row.humidity, 1)}% RH</strong></td>
            <td>${pm}</td>
            <td>${co2v}</td>
            <td>${vocv}</td>
            <td>${row.air_quality ?? ''}</td>
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

    let csv = 'Timestamp,Device ID,Temperature (C),Humidity (% RH),PM2.5,CO2,VOC,Alert Level,Device Timestamp\n';

    allData.forEach(row => {
        const timestamp = formatTimestamp(row.created_at);
        const pm = row.pm25 != null ? row.pm25 : '';
        csv += `"${timestamp}","${row.device_id}",${row.temperature},${row.humidity},${pm},${row.co2 ?? ''},${row.voc ?? ''},${row.alert_level ?? 0},${row.timestamp_ms ?? ''}\n`;
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
