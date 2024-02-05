// robot-client.js

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

const MIN_LUMINOSITY = 0;
const MAX_LUMINOSITY = 1000;
const MIN_SERVO_POSITION = 750;
const MAX_SERVO_POSITION = 2000;

const MIN_BRIGHTNESS = 125;
const MAX_BRIGHTNESS = 0;

const componentStatusMap = {
    toggleYellow: false,
    toggleGreen: false,
    toggleBlue: false,
    toggleServomotor: false,
    toggleAutoServo: false,
    toggleInfrared: false,
    toggleDetection: false,
    toggleRecording: false,
    toggleStrip: false,
    toggleProximity: false,
    toggleNight: false,
    toggleRainbow: false,
};

let intervalServoAuto = null;
let intervalProximity = null;
let intervalNight = null;

const yellowLed = new Gpio(19, 'out');
const greenLed = new Gpio(26, 'out');
const blueLed = new Gpio(13, 'out');
const servomotor = new pigpio.Gpio(23, { mode: pigpio.Gpio.OUTPUT });
const infrared = new Gpio(17, 'out');

function setLedPins() {
    yellowLed.writeSync(componentStatusMap.toggleYellow ? 1 : 0);
    greenLed.writeSync(componentStatusMap.toggleGreen ? 1 : 0);
    blueLed.writeSync(componentStatusMap.toggleBlue ? 1 : 0);
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function toggleComponent(component) {
    componentStatusMap[component] = !componentStatusMap[component];
}

function setServoPosition(position) {
    servomotor.servoWrite(position);
}

function openServoCompletely() {
    setServoPosition(MAX_SERVO_POSITION);
    console.log("Servo opened completely");
}

function closeServoCompletely() {
    setServoPosition(MIN_SERVO_POSITION);
    console.log("Servo closed completely");
}

function mapServoPosition(luminosity) {
    const mappedPosition = Math.floor(
        ((luminosity - MIN_LUMINOSITY) / (MAX_LUMINOSITY - MIN_LUMINOSITY)) *
        (MIN_SERVO_POSITION - MAX_SERVO_POSITION) + MAX_SERVO_POSITION
    );

    return mappedPosition;
}

function adjustServoBasedOnLight() {
    if (!componentStatusMap.toggleAutoServo) {
        return; // If auto mode is not enabled, do nothing
    }

    const luminosity = readLuminosity();
    const servoPosition = mapServoPosition(luminosity);

    setServoPosition(servoPosition);
    console.log(`Servo adjusted based on light. Luminosity: ${luminosity}, Servo Position: ${servoPosition}`);
}

function toggleServomotor() {
    toggleComponent('toggleServomotor');

    if (componentStatusMap.toggleServomotor) {
        if (!componentStatusMap.toggleAutoServo) {
            openServoCompletely();
            console.log('Blinds open');
        } else {
            // Start auto mode
            intervalServoAuto = setInterval(adjustServoBasedOnLight, 1000);
        }
    } else {
        // Close servo and stop auto mode
        closeServoCompletely();
        clearInterval(intervalServoAuto);
        console.log('Blinds closed');
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function toggleAutoServomotor() {
    toggleComponent('toggleAutoServo');

    clearInterval(intervalServoAuto);

    if (componentStatusMap.toggleAutoServo && componentStatusMap.toggleServomotor) {
        intervalServoAuto = setInterval(adjustServoBasedOnLight, 1000);
    }

    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function toggleInfrared() {
    toggleComponent('toggleInfrared');
    infrared.writeSync(componentStatusMap.toggleInfrared ? 1 : 0);
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
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
    console.log('Starting movie...');
    fetch('http://jaunepi.local:8088/0/action/eventstart')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error starting movie:', error));
    console.log('Movie started.');
}

function endMovie() {
    console.log('Ending movie...');
    fetch('http://jaunepi.local:8088/0/action/eventend')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error ending movie:', error));
    console.log('Movie ended.');
}

function toggleRecording() {
    toggleComponent('toggleRecording');
    if (componentStatusMap.toggleRecording) {
        startMovie();
    } else {
        endMovie();
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function startDetection() {
    console.log('Starting detection...');
    fetch('http://jaunepi.local:8088/0/detection/start')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error starting detection:', error));
    console.log('Detection started.');

}

function pauseDetection() {
    console.log('Pausing detection...');
    fetch('http://jaunepi.local:8088/0/detection/pause')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error pausing detection:', error));
    console.log('Detection paused.');
}

function toggleDetection() {
    updateDetectionStatus()
    toggleComponent('toggleDetection');
    if (componentStatusMap.toggleDetection) {
        startDetection();
    } else {
        pauseDetection();
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function updateDetectionStatus() {
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
            const isActive = data.includes('status ACTIVE');
            if (isActive) {
                componentStatusMap.toggleDetection = true;
            } else {
                componentStatusMap.toggleDetection = false;
            }
        })
        .catch(error => console.error('Error:', error));
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

function readLuminosity() {
    const luminosityData = i2c1.readWordSync(DEVICE_ADDRESS, CDATAL);
    return luminosityData;
}

function readProximity() {
    const proximityData = i2c1.readWordSync(DEVICE_ADDRESS, PDATAL);
    return proximityData;
}

function setBrightness(brightness) {
    console.log('Set brightness...');
    fetch(`http://jaunepi.local:5000/set_brightness/${brightness}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch brightness');
            } else {
                componentStatusMap.toggleStrip = true;
                socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
            }
        })
        .catch(error => console.error('Error turning off lights:', error));
}

function mapBrightness(luminosity) {
    const mappedPosition = Math.floor(
        ((luminosity - MIN_LUMINOSITY) / ( MAX_LUMINOSITY - MIN_LUMINOSITY)) *
        (MAX_BRIGHTNESS - MIN_BRIGHTNESS) +
        MIN_BRIGHTNESS
    );

    return mappedPosition;
}

function adjustLightBasedOnLuminosity() {
    const luminosity = readLuminosity();
    const brightness = mapBrightness(luminosity);
    setBrightness(brightness);
    console.log(`Light adjusted based on proximity. Proximity: ${proximity}, Brightness: ${brightness}`);
}

function adjustLightBasedOnProximity() {
    if (readProximity() < 3) {
        if (!componentStatusMap.toggleStrip) {
            toggleStrip();
        }
    } else {
        if (componentStatusMap.toggleStrip){
            toggleStrip();
        }
    }
}

function toggleProximity() {
    toggleComponent('toggleProximity');
    if (componentStatusMap.toggleProximity) {
        clearInterval(intervalProximity);

        intervalProximity = setInterval(adjustLightBasedOnProximity, 1000);
    } else {
        clearInterval(intervalProximity);
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function turnOnLights() {
    console.log('Turning on lights...');
    
    fetch('http://jaunepi.local:5000/on')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch /on');
            }
            // Chain the second fetch request
            return fetch('http://jaunepi.local:5000/daylight');
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

function stripRandomColor() {
    console.log('Random light color...');
    fetch('http://jaunepi.local:5000/random_color')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            } else {
                componentStatusMap.toggleStrip = true;
                socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
            }
        })
        .catch(error => console.error('Error turning off lights:', error));
}

function toggleStrip() {
    toggleComponent('toggleStrip');
    if (componentStatusMap.toggleStrip) {
        turnOnLights();
        console.log('LED Strip turned on');
    } else {
        turnOffLights();
        console.log('LED Strip turned off');
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function adjustLightBasedOnLuminosity() {
    if (readLuminosity() < 12) {
        if (!componentStatusMap.toggleStrip) {
            toggleStrip();
        }
    } else {
        if (componentStatusMap.toggleStrip){
            toggleStrip();
        }
    }
}

function toggleNight() {
    toggleComponent('toggleNight');
    if (componentStatusMap.toggleNight) {
        clearInterval(intervalNight);

        intervalNight = setInterval(adjustLightBasedOnLuminosity, 1000);
    } else {
        clearInterval(intervalNight);
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}

function startRainbow() {
    console.log('Rainbow!!!');
    fetch('http://jaunepi.local:5000/rainbow/start')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error starting rainbow', error));
}

function stopRainbow() {
    console.log('No more rainbow...');
    fetch('http://jaunepi.local:5000/rainbow/stop')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
        })
        .catch(error => console.error('Error stopping rainbow:', error));
}

function toggleRainbow() {
    toggleComponent('toggleRainbow');
    if (componentStatusMap.toggleRainbow) {
        startRainbow();
        console.log('Rainbow!');
    } else {
        stopRainbow();
        console.log(" :'( ");
    }
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
}


socket.on('message-from-client', message => {
    switch (message.type) {
        case 'toggle-yellow':
            toggleComponent('toggleYellow');           
            break;
        case 'toggle-green':
            toggleComponent('toggleGreen');
            break;
        case 'toggle-blue':
            toggleComponent('toggleBlue');
            break;
        case 'toggle-auto-servo':
            toggleAutoServomotor();
            break;
        case 'toggle-servomotor':
            toggleServomotor();
            break;
        case 'toggle-infrared':
            toggleInfrared();
            break;
        case 'snapshot':
            takeSnapshot();
            break;
        case 'toggle-recording':
            toggleRecording();
            break;
        case 'restart-motion':
            restartMotion();
            break;
        case 'toggle-detection': 
            toggleDetection();
            break;  
        case 'toggle-strip':
            toggleStrip();
            break;
        case 'strip-random-color':
            stripRandomColor();
            break;
        case 'toggle-night':
            toggleNight();
            break;
        case 'toggle-rainbow':
            toggleRainbow();
            break;
        case 'toggle-proximity':
            toggleProximity();
            break;
    }
    setLedPins();
});

// socket.on('motion-detected', () => {
//     socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
// });

socket.on('event-start', () => {
    componentStatusMap.toggleRecording = true;
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
});

socket.on('event-end', () => {
    componentStatusMap.toggleRecording = false;
    socket.emit('message-from-robot', { componentStatusMap, to: 'USER' });
});

socket.on('connect', () => {
    updateDetectionStatus();
    socket.emit('init-robot', { id: 'ROBOT' });
});

// Set up the interval to call the function every 2 seconds (2000 milliseconds)
setInterval(updateDetectionStatus, 2000);