import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = io('http://jaunepi.local:8080', { path: '/api/socket/' });

const buttons = {
    jaune: document.getElementById('jaune-button'),
    blue: document.getElementById('blue-button'),
    green: document.getElementById('green-button'),
    servo: document.getElementById('servo-button'),
    irFilter: document.getElementById('filtreIR-button'),
    snapshot: document.getElementById('snapshot-button'),
    makeMovie: document.getElementById('make-movie-button'),
    restart: document.getElementById('restart-button'),
    toggleDetection: document.getElementById('toggle-detection-button'),
    // detectionOn: document.getElementById('detection-on-button'),
    // detectionOff: document.getElementById('detection-off-button'),
    // stripOn: document.getElementById('strip-on-button'),
    // stripOff: document.getElementById('strip-off-button'),
    stripSwitch: document.getElementById('strip-switch-button'),
    nightLight: document.getElementById('night-light-button'),
};

const leds = {
    jaune: document.getElementById('jaune').getElementsByClassName('Led')[0],
    green: document.getElementById('green').getElementsByClassName('Led')[0],
    blue: document.getElementById('blue').getElementsByClassName('Led')[0],
    servomotor: document.getElementById('servomotor').getElementsByClassName('Led')[0],
};

const handleLedChange = (led) => {
    socket.emit('message-from-client', { to: 'ROBOT', type: 'change-led', led });
};

let servomotorActive = false;

const handleServoButtonClick = () => {
    if (!servomotorActive) {
        servomotorActive = true;
        socket.emit('message-from-client', { to: 'ROBOT', type: 'rotate-servomotor' });
        leds.servomotor.classList.add('LedOnGreen');
        setTimeout(() => {
            servomotorActive = false;
            leds.servomotor.classList.remove('LedOnGreen');
        }, 2000);
    }
};


function updateStatus(motionDetected) {
    const statusElement = document.getElementById('motionEventIndicator');

    if (statusElement) {
        statusElement.innerText = motionDetected ? 'Motion Detected!' : 'On Standby';

        if (motionDetected) {
            
            setTimeout(() => {
                updateStatus(false); // Update the status to 'On Standby' after 2000 milliseconds
            }, 3000);
        }
    } else {
        console.error('Status element not found.');
    }
}


function updateServiceStatus(data) {
    const statusElement = document.getElementById('statusIndicator');
    
    if (statusElement) {
        if (data && data.detectionStatus) {
            statusElement.innerText = data.detectionStatus;
        } else {
            statusElement.innerText = 'Detection Status N/A';
        }
    } else {
        console.error('Status indicator element not found.');
    }
}


const handleGenericButtonClick = (actionType) => {
    socket.emit('message-from-client', { to: 'ROBOT', type: actionType });
};


// Event listeners
buttons.jaune.onclick = () => handleLedChange('jaune');
buttons.blue.onclick = () => handleLedChange('blue');
buttons.green.onclick = () => handleLedChange('green');
buttons.servo.onclick = handleServoButtonClick;
buttons.irFilter.onclick = () => handleGenericButtonClick('toggle-ir-filter');
buttons.snapshot.onclick = () => handleGenericButtonClick('take-snapshot');
buttons.makeMovie.onclick = () => handleGenericButtonClick('make-movie');
buttons.restart.onclick = () => handleGenericButtonClick('restart-motion');
buttons.toggleDetection.onclick = () => handleGenericButtonClick('toggle-detection');
// buttons.detectionOn.onclick = () => handleGenericButtonClick('start-detection');
// buttons.detectionOff.onclick = () => handleGenericButtonClick('pause-detection');
// buttons.stripOn.onclick = () => handleGenericButtonClick('strip-on');
// buttons.stripOff.onclick = () => handleGenericButtonClick('strip-off');
buttons.stripSwitch.onclick = () => handleGenericButtonClick('strip-switch');
buttons.nightLight.onclick = () => handleGenericButtonClick('night-light');


// Update UI based on server messages
socket.on('message-from-robot', ({ ledStatusMap }) => {
    if (ledStatusMap) {
        Object.entries(ledStatusMap).forEach(([led, status]) => {
            if (leds[led]) {
                leds[led].classList.toggle('LedOn', status);
            }
        });
    }
});


socket.on('motion-detected', () => {
    console.log('Motion detected event received from server');
    updateStatus(true);
});


socket.on('message-from-robot', (detectionStatus) => {
    console.log('Received update-detection-status from server:', detectionStatus);
    updateServiceStatus(detectionStatus);
});

socket.on('connect', () => {
    socket.emit('init-user', { id: 'USER' });
    socket.emit('message-from-client', { to: 'ROBOT', type: 'get-detection-status' });
});