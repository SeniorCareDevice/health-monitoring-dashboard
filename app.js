const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
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

    // Handle incoming data from ESP32
    socket.on('message', (data) => {
        console.log('Received data:', data);

        try {
            const parsedData = JSON.parse(data);
            latestData = {
                ...parsedData,
                timestamp: new Date()
            };

            // Broadcast the new data to all connected clients
            io.emit('newData', latestData);
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});