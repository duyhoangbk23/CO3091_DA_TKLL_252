let temperatureChart = null;
let humidityChart = null;
let pm25Chart = null;
let co2Chart = null;
let vocChart = null;
let samples = [];
let lastNoiseAt = 0;
let lastNoiseMetric = '';

const MAX_VISIBLE_SAMPLES = 20;
const REFRESH_MS = 2000;

const CHART_DOMAIN = {
    temperature: { delta: 5, fallback: [20, 35] },
    humidity: { delta: 10, fallback: [0, 100] },
    pm25: { delta: 10, fallback: [0, 50] },
    co2: { delta: 100, fallback: [400, 1200] },
    voc: { delta: 50, fallback: [0, 500] }
};

const NOISE_CONFIG = {
    temperature: { maxDelta: 5, label: 'Temperature' },
    humidity: { maxDelta: 15, label: 'Humidity' },
    pm25: { maxDelta: 40, label: 'PM2.5' },
    co2: { maxDelta: 700, label: 'CO2' },
    voc: { maxDelta: 700, label: 'VOC' }
};

document.addEventListener('DOMContentLoaded', () => {
    initializeChartsWhenReady();
    refreshFromDatabase();
    updateFooterTime();
    setInterval(refreshFromDatabase, REFRESH_MS);
    setInterval(updateNoiseAlert, 1000);
    setInterval(updateFooterTime, 1000);
});

function initializeChartsWhenReady() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded yet. Retrying chart initialization...');
        setTimeout(initializeChartsWhenReady, 500);
        return;
    }
    if (temperatureChart) return;
    temperatureChart = createLineChart('temperature-chart', 'Temperature (C)', '#dc3545', 'C');
    humidityChart = createLineChart('humidity-chart', 'Humidity (% RH)', '#0dcaf0', '% RH');
    pm25Chart = createLineChart('pm25-chart', 'PM2.5 (ug/m3)', '#ffc107', 'ug/m3');
    co2Chart = createLineChart('co2-chart', 'CO2 (ppm)', '#6c757d', 'ppm');
    vocChart = createLineChart('voc-chart', 'VOC (index)', '#0d6efd', 'index');
    updateCharts(samples);
}

function createLineChart(canvasId, label, color, unit) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label,
                data: [],
                borderColor: color,
                backgroundColor: `${color}20`,
                tension: 0.35,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 5,
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: unit }
                }
            }
        }
    });
}

async function refreshFromDatabase() {
    try {
        const history = await fetchHistoricalData(MAX_VISIBLE_SAMPLES, 24);
        samples = normalizeRows((history || [])
            .map(normalizeTelemetry)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
            .slice(-MAX_VISIBLE_SAMPLES);

        updateStatistics(samples);
        updateCharts(samples);
        setConnectionStatus(true);
    } catch (error) {
        console.error('Failed to load chart data from database:', error);
        setConnectionStatus(false);
    }
}

function normalizeTelemetry(row) {
    return {
        ...row,
        created_at: row.created_at || row.received_at || row.timestamp || new Date().toISOString()
    };
}

function normalizeRows(rows) {
    return ChartUtils.replaceNoiseWithPrevious(rows || [], NOISE_CONFIG, event => {
        lastNoiseAt = Date.now();
        lastNoiseMetric = NOISE_CONFIG[event.metric]?.label || event.metric;
    });
}

function updateStatistics(data) {
    const avg = (values, digits = 1) => {
        const clean = ChartUtils.toFiniteNumbers(values);
        if (!clean.length) return '-';
        return (clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(digits);
    };

    document.getElementById('stat-avg-temp').textContent = avg(data.map(row => metricValue(row, 'temperature', 'temp')));
    document.getElementById('stat-avg-humidity').textContent = avg(data.map(row => metricValue(row, 'humidity', 'rh')));
    document.getElementById('stat-avg-pm25').textContent = avg(data.map(row => metricValue(row, 'pm25', 'pm')));
    document.getElementById('stat-avg-co2').textContent = avg(data.map(row => metricValue(row, 'co2', 'co2')), 0);
    document.getElementById('stat-avg-voc').textContent = avg(data.map(row => metricValue(row, 'voc', 'voc')), 0);
}

function updateCharts(data) {
    if (!temperatureChart || !humidityChart || !pm25Chart || !co2Chart || !vocChart) return;
    const labels = data.map(row => new Date(row.created_at).toLocaleTimeString());
    updateChart(temperatureChart, labels, data.map(row => metricValue(row, 'temperature', 'temp')), CHART_DOMAIN.temperature);
    updateChart(humidityChart, labels, data.map(row => metricValue(row, 'humidity', 'rh')), CHART_DOMAIN.humidity);
    updateChart(pm25Chart, labels, data.map(row => metricValue(row, 'pm25', 'pm')), CHART_DOMAIN.pm25);
    updateChart(co2Chart, labels, data.map(row => metricValue(row, 'co2', 'co2')), CHART_DOMAIN.co2);
    updateChart(vocChart, labels, data.map(row => metricValue(row, 'voc', 'voc')), CHART_DOMAIN.voc);
}

function updateChart(chart, labels, values, domainConfig) {
    chart.data.labels = labels.slice(-MAX_VISIBLE_SAMPLES);
    chart.data.datasets[0].data = values.slice(-MAX_VISIBLE_SAMPLES);
    const [min, max] = ChartUtils.calculateYAxisDomain(chart.data.datasets[0].data, domainConfig);
    chart.options.scales.y.min = min;
    chart.options.scales.y.max = max;
    chart.update();
}

function metricValue(row, valueKey, healthKey) {
    const health = row.sensor_health || {};
    if (health[healthKey] && health[healthKey] !== 'OK') return null;
    const value = Number(row[valueKey]);
    return Number.isFinite(value) ? value : null;
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
    alert.textContent = `Noise detected on ${lastNoiseMetric} ${seconds} seconds ago. The chart is holding the previous valid value.`;
}

function setConnectionStatus(online) {
    const badge = document.getElementById('connection-status');
    if (!badge) return;
    badge.textContent = online ? 'Connected' : 'Disconnected';
    badge.className = online ? 'badge bg-success' : 'badge bg-danger';
}

function updateFooterTime() {
    document.getElementById('footer-time').textContent = new Date().toLocaleString();
}
