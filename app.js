const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store the latest data
let latestData = {
    temperature: 0,
    heartRate: 0,
    spo2: 0,
    fallDetected: false,
    accMag: 0,
    latitude: 0,
    longitude: 0,
    satellites: 0,
    timestamp: new Date()
};

// API endpoint to receive data from ESP32
app.post('/api/data', (req, res) => {
    console.log('Received data:', req.body);
    // Update the latest data
    latestData = {
        ...req.body,
        timestamp: new Date()
    };
    // Emit the new data to all connected clients
    io.emit('newData', latestData);
    res.status(200).json({ message: 'Data received successfully' });
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the latest data on request
app.get('/api/data', (req, res) => {
    res.json(latestData);
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('New client connected');
    // Send the latest data to the newly connected client
    socket.emit('initialData', latestData);
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});