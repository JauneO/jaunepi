const io = require('socket.io-client');
const Gpio = require('onoff').Gpio;
const pigpio = require('pigpio');
const i2c = require('i2c-bus');

const socket = io('http://localhost:8080', { path: '/api/socket' });

// Adresse I2C du capteur APDS-9930
const DEVICE_ADDRESS = 0x39;

// Registres du capteur APDS-9930
const ENABLE = 0x80;
const ATIME = 0x81;
const CONTROL = 0x8F;
const STATUS = 0x93;
const CDATAL = 0x94;
const CDATAH = 0x95;
const PDATAL = 0x96;
const PDATAH = 0x97;

// Crée une instance de bus I2C
const i2c1 = i2c.openSync(1);  // Utilisez le bon numéro de bus (1 ou 20)

// Configuration du capteur
i2c1.writeByteSync(DEVICE_ADDRESS, ENABLE, 0x03);  // Active la proximité et la mesure de la lumière
i2c1.writeByteSync(DEVICE_ADDRESS, ATIME, 0xFF);    // Temps d'intégration maximal
i2c1.writeByteSync(DEVICE_ADDRESS, CONTROL, 0x0D);  // Gain x1 et mode de mesure


let isNormalMode = true;
let isLedStripOn = false;
let isDetectionRunning = false;
let isMakingMovie = false;



const ledStatusMap = {
    jaune: false,
    green: false,
    blue: false,
    servo: false,
};

const jauneLed = new Gpio(19, 'out');
const greenLed = new Gpio(26, 'out');
const blueLed = new Gpio(13, 'out');
const servomotor = new pigpio.Gpio(23, { mode: pigpio.Gpio.OUTPUT });
const filtreIR = new Gpio(17, 'out');


function toggleLed(led) {
    ledStatusMap[led] = !ledStatusMap[led];
}


function setLedPins() {
    jauneLed.writeSync(ledStatusMap.jaune ? 1 : 0);
    greenLed.writeSync(ledStatusMap.green ? 1 : 0);
    blueLed.writeSync(ledStatusMap.blue ? 1 : 0);
    socket.emit('message-from-robot', { ledStatusMap, to: 'USER' });
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


function takeSnapshot() {
    console.log('Fetching snapshot...');
    fetch('http://jaunepi.local:8088/0/action/snapshot')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.text();
        })
        .catch(error => console.error('Error fetching snapshot:', error));
}


function startMovie() {
    if (!isMakingMovie) {
        console.log('Starting movie...');
        fetch('http://jaunepi.local:8088/0/action/eventstart')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
            })
            .catch(error => console.error('Error starting movie:', error));

        isMakingMovie = true;
        console.log('Movie started.');
    } else {
        console.log('Movie is already running.');
    }
}

function endMovie() {
    if (isMakingMovie) {
        console.log('Ending movie...');
        fetch('http://jaunepi.local:8088/0/action/eventend')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
            })
            .catch(error => console.error('Error ending movie:', error));

        isMakingMovie = false;
        console.log('Movie ended.');
    } else {
        console.log('Movie is not running.');
    }
}

function makeMovie(){
    if (!isMakingMovie) {
        startMovie();
    } else {
        endMovie();
    }
}

// function startDetection() {
//     console.log('Starting detection...');
//     fetch('http://jaunepi.local:8088/0/detection/start')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to fetch');
//             }
//         })
//         .catch(error => console.error('Error starting detection:', error));
//     }


// function pauseDetection() {
//     console.log('Pausing detection...');
//     fetch('http://jaunepi.local:8088/0/detection/pause')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to fetch');
//             }
//         })
//         .catch(error => console.error('Error pausing detection:', error));
// }


function startDetection() {
    if (!isDetectionRunning) {
        console.log('Starting detection...');
        fetch('http://jaunepi.local:8088/0/detection/start')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
            })
            .catch(error => console.error('Error starting detection:', error));

        isDetectionRunning = true;
        console.log('Detection started.');
    } else {
        console.log('Detection is already running.');
    }
}

function pauseDetection() {
    if (isDetectionRunning) {
        console.log('Pausing detection...');
        fetch('http://jaunepi.local:8088/0/detection/pause')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
            })
            .catch(error => console.error('Error pausing detection:', error));

        isDetectionRunning = false;
        console.log('Detection paused.');
    } else {
        console.log('Detection is not running.');
    }
}

function toggleDetection(){
    if (isDetectionRunning) {
        pauseDetection();
    } else {
        startDetection();
    }
}

function restartMotion() {
    console.log('Restarting motion...');
    fetch('http://jaunepi.local:8088/0/action/restart')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error restarting motion:', error));
}


function getDetectionStatus() {
    console.log('Fetching detection status...');
    fetch('http://jaunepi.local:8088/0/detection/status')
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


function readLuminosity() {
    const luminosityData = i2c1.readWordSync(DEVICE_ADDRESS, CDATAL);
    return luminosityData;
}

function turnOnLights() {
    console.log('Turning on lights...');
    
    fetch('http://jaunepi.local:5000/on')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch /on');
            }
            // Chain the second fetch request
            return fetch('http://jaunepi.local:5000/random_color');
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch /random_color');
            }
            console.log('Lights turned on successfully.');
        })
        .catch(error => console.error('Error turning on lights:', error));
}



function turnOffLights() {
    console.log('Turning off lights...');
    fetch('http://jaunepi.local:5000/off')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error turning off lights:', error));
}

function toggledLedStrip() {
    isLedStripOn = !isLedStripOn;
    if (isLedStripOn) {
        turnOnLights();
        console.log('LED Strip turned on');
    } else {
        turnOffLights();
        console.log('LED Strip turned off');
    }
}


function controlLedStrip() {
    if (readLuminosity()< 12) {
        turnOnLights() 
        console.log('LED Strip turned on');
    } else {
        turnOffLights() 
        console.log('LED Strip turned off');
    }
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
        case 'make-movie':
            makeMovie();
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
        case 'toggle-detection': 
            toggleDetection();
            break;  
        case 'update-status':
            updateStatus();
            break;
        case 'get-detection-status':
            getDetectionStatus();
            break;
        case 'strip-switch':
            toggledLedStrip();
            break;
        case 'strip-on':
            turnOnLights();
            break;
        case 'strip-off':
            turnOffLights();
            break;
        case 'night-light':
            controlLedStrip();
            break;
        
    }
    setLedPins();
});

socket.on('motion-detected', () => {
    socket.emit('motion-detected', {});
    // console.log('Motion detected event emitted to clients');
});

setInterval(() => {
    getDetectionStatus();
}, 1000);


socket.on('connect', () => {
    // Ensure the initial state is sent to the frontend on connection
    socket.emit('ir-filter-status', isNormalMode);
    socket.emit('message-from-robot', { ledStatusMap, to: 'USER' });
    socket.emit('init-robot', { id: 'ROBOT' });
});
