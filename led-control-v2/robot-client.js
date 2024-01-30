const io = require('socket.io-client');
const Gpio = require('onoff').Gpio;
const pigpio = require('pigpio');

const socket = io('http://localhost:8080', { path: '/api/socket' });

const ledStatusMap = {
    jaune: false,
    green: false,
    blue: false,
    servo: false,
};

let isNormalMode = true;

const jauneLed = new Gpio(19, 'out');
const greenLed = new Gpio(26, 'out');
const blueLed = new Gpio(13, 'out');
const servomotor = new pigpio.Gpio(21, { mode: pigpio.Gpio.OUTPUT });
const filtreIR = new Gpio(17, 'out');


function toggleLed(led) {
    ledStatusMap[led] = !ledStatusMap[led];
}


function rotateServomotor() {
    servomotor.servoWrite(2000);
    console.log("jaw");
    setTimeout(() => {
        servomotor.servoWrite(1500);
        console.log("nein");
    }, 2000);
}


function toggleIRFilter() {
    isNormalMode = !isNormalMode;
    filtreIR.writeSync(isNormalMode ? 0 : 1);
    socket.emit('ir-filter-status', isNormalMode);
    console.log(isNormalMode ? "Switched to Normal Mode" : "Switched to Night-vision Mode");
    socket.emit('message-from-robot', { isNormalMode, to: 'USER' });
}


function setLedPins() {
    jauneLed.writeSync(ledStatusMap.jaune ? 1 : 0);
    greenLed.writeSync(ledStatusMap.green ? 1 : 0);
    blueLed.writeSync(ledStatusMap.blue ? 1 : 0);
    socket.emit('message-from-robot', { ledStatusMap, to: 'USER' });
}

function takeSnapshot() {
    console.log('Fetching snapshot...');
    fetch('http://192.168.0.193:8088/0/action/snapshot')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.text();
        })
        .catch(error => console.error('Error fetching snapshot:', error));
}


function startDetection() {
    console.log('Starting detection...');
    fetch('http://192.168.0.193:8088/0/detection/start')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error starting detection:', error));
    }


function pauseDetection() {
    console.log('Pausing detection...');
    fetch('http://192.168.0.193:8088/0/detection/pause')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error pausing detection:', error));
}


function restartMotion() {
    console.log('Restarting motion...');
    fetch('http://192.168.0.193:8088/0/action/restart')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error restarting motion:', error));
}


function getDetectionStatus() {
    console.log('Fetching detection status...');
    fetch('http://192.168.0.193:8088/0/detection/status')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.text();
        })
        .then(data => {
            console.log(data);
            socket.emit('message-from-robot', { detectionStatus: data.trim(), to: 'USER' });
        })
        .catch(error => console.error('Error:', error));
}



function turnOnLights() {
    console.log('Turning on lights...');
    fetch('http://192.168.0.193:5000/on')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error turning on lights:', error));
}


function turnOffLights() {
    console.log('Turning off lights...');
    fetch('http://192.168.0.193:5000/off')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error turning off lights:', error));
}


socket.on('message-from-client', message => {
    switch (message.led) {
        case 'jaune':
        case 'green':
        case 'blue':
            toggleLed(message.led);
            break;
        case 'servo':
            rotateServomotor();
            break;
    }

    switch (message.type) {
        case 'rotate-servomotor':
            rotateServomotor();
            break;
        case 'toggle-ir-filter':
            toggleIRFilter();
            break;
        case 'take-snapshot':
            takeSnapshot();
            break;
        case 'restart-motion':
            restartMotion();
            break;
        case 'start-detection':
            startDetection();
            break;
        case 'pause-detection':
            pauseDetection();
            break;
        case 'strip-on':
            turnOnLights();
            break;
        case 'strip-off':
            turnOffLights();
            break;
        case 'update-status':
            updateStatus();
            break;
        case 'get-detection-status':
            getDetectionStatus();
            break;
    }
    setLedPins();
});

socket.on('motion-detected', () => {
    socket.emit('motion-detected', {});
    console.log('Motion detected event emitted to clients');
});

setInterval(() => {
    getDetectionStatus();
}, 5000);


socket.on('connect', () => {
    // Ensure the initial state is sent to the frontend on connection
    socket.emit('ir-filter-status', isNormalMode);
    socket.emit('message-from-robot', { ledStatusMap, to: 'USER' });
    socket.emit('init-robot', { id: 'ROBOT' });
});
