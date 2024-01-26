const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

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
    path: '/api/socket/'
});

const port = process.env.PORT || 8080;

app.use('/static', express.static(path.join(__dirname, 'src/public')));

// Add the proxy middleware for paths starting with '/proxy'
app.use('/proxy', createProxyMiddleware({ target: 'http://192.168.0.193:8088', changeOrigin: true }));

// Middleware to handle CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.0.193:8088'); // Update with your client's origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/main', function (req, res) {
    res.sendFile(path.join(__dirname, './src/index.html'));
});

server.listen(port);

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

// Add a new route for motion detection events
app.post('/api/motion-detected', (req, res) => {
    // Broadcast a motion detection event to all connected clients
    io.emit('motion-detected', { message: 'Motion detected!' });
    res.status(200).send('Motion detection event sent to clients');
});
