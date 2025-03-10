// Initialize socket.io connection
const socket = io();

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const lastUpdate = document.getElementById('last-update');
const temperatureValue = document.getElementById('temperature-value');
const heartRateValue = document.getElementById('heart-rate-value');
const spo2Value = document.getElementById('spo2-value');
const fallIndicator = document.getElementById('fall-indicator');
const fallStatusText = document.getElementById('fall-status-text');
const accelerationValue = document.getElementById('acceleration-value');
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const satellitesElement = document.getElementById('satellites');

// Initialize the map
let map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let marker = null;

// Initialize gauges
const temperatureGauge = new Gauge(document.getElementById('temperature-gauge')).setOptions({
    angle: 0,
    lineWidth: 0.3,
    radiusScale: 0.9,
    pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color: '#2c3e50'
    },
    staticLabels: {
        font: "10px sans-serif",
        labels: [20, 25, 30, 35, 40, 45],
        color: "#333333",
        fractionDigits: 0
    },
    staticZones: [
        {strokeStyle: "#3498db", min: 20, max: 35},
        {strokeStyle: "#f39c12", min: 35, max: 38},
        {strokeStyle: "#e74c3c", min: 38, max: 45}
    ],
    limitMax: false,
    limitMin: false,
    highDpiSupport: true
});
temperatureGauge.maxValue = 45;
temperatureGauge.setMinValue(20);
temperatureGauge.set(0);

const heartRateGauge = new Gauge(document.getElementById('heart-rate-gauge')).setOptions({
    angle: 0,
    lineWidth: 0.3,
    radiusScale: 0.9,
    pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color: '#2c3e50'
    },
    staticLabels: {
        font: "10px sans-serif",
        labels: [0, 50, 100, 150, 200],
        color: "#333333",
        fractionDigits: 0
    },
    staticZones: [
        {strokeStyle: "#e74c3c", min: 0, max: 40},
        {strokeStyle: "#f39c12", min: 40, max: 60},
        {strokeStyle: "#2ecc71", min: 60, max: 100},
        {strokeStyle: "#f39c12", min: 100, max: 140},
        {strokeStyle: "#e74c3c", min: 140, max: 200}
    ],
    limitMax: false,
    limitMin: false,
    highDpiSupport: true
});
heartRateGauge.maxValue = 200;
heartRateGauge.setMinValue(0);
heartRateGauge.set(0);

const spo2Gauge = new Gauge(document.getElementById('spo2-gauge')).setOptions({
    angle: 0,
    lineWidth: 0.3,
    radiusScale: 0.9,
    pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color: '#2c3e50'
    },
    staticLabels: {
        font: "10px sans-serif",
        labels: [80, 85, 90, 95, 100],
        color: "#333333",
        fractionDigits: 0
    },
    staticZones: [
        {strokeStyle: "#e74c3c", min: 80, max: 90},
        {strokeStyle: "#f39c12", min: 90, max: 95},
        {strokeStyle: "#2ecc71", min: 95, max: 100}
    ],
    limitMax: false,
    limitMin: false,
    highDpiSupport: true
});
spo2Gauge.maxValue = 100;
spo2Gauge.setMinValue(80);
spo2Gauge.set(0);

// Socket events
socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'connected';
    
    // Fetch initial data
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error fetching initial data:', error);
        });
});

socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.className = 'disconnected';
});

socket.on('initialData', (data) => {
    updateDashboard(data);
});

socket.on('newData', (data) => {
    updateDashboard(data);
});

// Function to update dashboard with new data
function updateDashboard(data) {
    // Update last update time
    const timestamp = new Date(data.timestamp);
    lastUpdate.textContent = `Last update: ${timestamp.toLocaleTimeString()}`;
    
    // Update temperature
    if (data.temperature && data.temperature !== 0) {
        temperatureGauge.set(data.temperature);
        temperatureValue.textContent = `${data.temperature.toFixed(1)} °C`;
    } else {
        temperatureValue.textContent = 'N/A';
    }
    
    // Update heart rate
    if (data.heartRate && data.heartRate !== 0) {
        heartRateGauge.set(data.heartRate);
        heartRateValue.textContent = `${data.heartRate.toFixed(0)} BPM`;
    } else {
        heartRateValue.textContent = 'N/A';
    }
    
    // Update SpO2
    if (data.spo2 && data.spo2 !== 0) {
        spo2Gauge.set(data.spo2);
        spo2Value.textContent = `${data.spo2.toFixed(0)}%`;
    } else {
        spo2Value.textContent = 'N/A';
    }
    
    // Update fall detection
    if (data.fallDetected) {
        fallIndicator.className = 'status-circle alert';
        fallStatusText.textContent = 'FALL DETECTED!';
        fallStatusText.style.color = '#e74c3c';
    } else {
        fallIndicator.className = 'status-circle normal';
        fallStatusText.textContent = 'No fall detected';
        fallStatusText.style.color = '#2c3e50';
    }
    
    // Update acceleration
    if (data.accMag) {
        accelerationValue.textContent = `${data.accMag.toFixed(2)} m/s²`;
    } else {
        accelerationValue.textContent = 'N/A';
    }
    
    // Update location
    if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
        latitudeElement.textContent = data.latitude.toFixed(6);
        longitudeElement.textContent = data.longitude.toFixed(6);
        satellitesElement.textContent = data.satellites || 'N/A';
        
        // Update map
        const newLatLng = [data.latitude, data.longitude];
        if (!marker) {
            marker = L.marker(newLatLng).addTo(map);
        } else {
            marker.setLatLng(newLatLng);
        }
        map.setView(newLatLng, 13);
    } else {
        latitudeElement.textContent = 'N/A';
        longitudeElement.textContent = 'N/A';
        satellitesElement.textContent = 'N/A';
    }
}

// Resize gauges when window is resized
window.addEventListener('resize', () => {
    temperatureGauge.update(true);
    heartRateGauge.update(true);
    spo2Gauge.update(true);
});