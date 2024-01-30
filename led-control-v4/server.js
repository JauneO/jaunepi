// server.js
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

// Configuration
const PORT = process.env.PORT || 8080;
const SOCKET_PATH = '/api/socket/';
const CLIENT_ORIGIN = 'http://jaunepi.local:8088';

// Declare variables globally
const usersMap = {};
const robotMap = {};

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        transports: ['polling', 'websocket'],
    },
    allowEIO3: true,
    path: SOCKET_PATH,
});

app.use('/static', express.static(path.join(__dirname, 'src/public')));

// Add the proxy middleware for paths starting with '/proxy'
// app.use('/proxy', createProxyMiddleware({ target: CLIENT_ORIGIN, changeOrigin: true }));
app.use('/proxy', createProxyMiddleware({ target: CLIENT_ORIGIN, changeOrigin: true, ws: true }));


// Middleware to handle CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CLIENT_ORIGIN); // Update with your client's origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/main', function (req, res) {
    res.sendFile(path.join(__dirname, './src/index.html'));
});

io.on('connection', (socket) => {
    console.log('connect')
    socket.on('message-from-client', (message) => {
        socket.to(robotMap[message.to]).emit('message-from-client', message);
    });

    socket.on('message-from-robot', (message) => {
        socket.to(usersMap[message.to]).emit('message-from-robot', message);
    });

    socket.on('init-user', ({ id }) => {
        usersMap[id] = socket.id;
    });

    socket.on('init-robot', ({ id }) => {
        robotMap[id] = socket.id;
    });
});

app.post('/api/motion-detected', (req, res) => {
    // Broadcast a motion detection event to all connected clients
    io.emit('motion-detected', {});
    res.status(200).send('Motion detection event sent to clients');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});