// src/public/script.js

// Importing socket.io-client
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

// Creating a socket connection
const socket = io('http://jaunepi.local:8080', { path: '/api/socket/' });

// Selecting all buttons and LEDs
const buttons = {
    toggleYellow: document.getElementById('toggle-yellow-button'),
    toggleBlue: document.getElementById('toggle-blue-button'),
    toggleGreen: document.getElementById('toggle-green-button'),
    toggleAutoServo: document.getElementById('toggle-auto-servo-button'),
    toggleServomotor: document.getElementById('toggle-servomotor-button'),
    toggleInfrared: document.getElementById('toggle-infrared-button'),
    snapshot: document.getElementById('snapshot-button'),
    toggleRecording: document.getElementById('toggle-recording-button'),
    restartMotion: document.getElementById('restart-motion-button'),
    toggleDetection: document.getElementById('toggle-detection-button'),
    toggleStrip: document.getElementById('toggle-strip-button'),
    stripRandomColor: document.getElementById('strip-random-color-button'),
    toggleNight: document.getElementById('toggle-night-button'),
    toggleRainbow: document.getElementById('toggle-rainbow-button'),
    toggleProximity: document.getElementById('toggle-proximity-button'),
};

// Selecting toggle buttons
const toggleButtons = {
    toggleYellow: document.getElementById('toggle-yellow-button'),
    toggleBlue: document.getElementById('toggle-blue-button'),
    toggleGreen: document.getElementById('toggle-green-button'),
    toggleAutoServo: document.getElementById('toggle-auto-servo-button'),
    toggleServomotor: document.getElementById('toggle-servomotor-button'),
    toggleRecording: document.getElementById('toggle-recording-button'),
    toggleInfrared: document.getElementById('toggle-infrared-button'),
    toggleDetection: document.getElementById('toggle-detection-button'),
    toggleStrip: document.getElementById('toggle-strip-button'),
    toggleProximity: document.getElementById('toggle-proximity-button'),
    toggleNight: document.getElementById('toggle-night-button'),
    toggleRainbow: document.getElementById('toggle-rainbow-button'),
};

// Function to update toggle button label
function updateToggleButtonLabel(button, isActive) {
    const actionName = button.getAttribute('data-action-name');
    if (actionName == 'Store'){
        button.textContent = `${actionName} ${isActive ? 'Ouvert' : 'Fermé'}`;
    } else if (actionName == 'Enregistrer'){
        button.textContent = `${isActive ? 'Enregistrement' : 'Enregistrer'}`;
    } else {
        button.textContent = `${actionName} ${isActive ? 'ON' : 'OFF'}`;
    }
}

// Function to handle component change
const handleComponentChange = (component) => {
    socket.emit('message-from-client', { to: 'ROBOT', type: component });
};

// Function to handle generic button click
const handleGenericButtonClick = (actionType) => {
    socket.emit('message-from-client', { to: 'ROBOT', type: actionType });
}

// Function to handle button click
function handleButtonClick(button) {
    const actionType = button.id.replace('-button', ''); // Extract action type from button ID

    const nonTogglingButtons = ['snapshot', 'restart-motion', 'strip-random-color'];
    if (nonTogglingButtons.includes(actionType)) {
        handleGenericButtonClick(actionType);
        return;
    }

    switch (actionType) {
        case 'toggle-yellow':
        case 'toggle-blue':
        case 'toggle-green':
        case 'toggle-auto-servo':
        case 'toggle-servomotor':
        case 'toggle-recording':
        case 'toggle-infrared':
        case 'toggle-detection':
        case 'toggle-strip':
        case 'toggle-proximity':
        case 'toggle-night':
        case 'toggle-rainbow':
            handleComponentChange(actionType);
            break;
        default:
            console.warn(`Unhandled actionType: ${actionType}`);
            break;
    }
}

// Add click event listeners to all buttons
Object.values(buttons).forEach(button => {
    button.addEventListener('click', () => {
        handleButtonClick(button);
    });
});


// Handling messages from the robot
socket.on('message-from-robot', (data) => {
    if (data.componentStatusMap) {
        // Updating toggle button status and label based on received data
        Object.entries(data.componentStatusMap).forEach(([component, status]) => {
            if (toggleButtons[component]) {
                toggleButtons[component].classList.toggle('On', status);
                updateToggleButtonLabel(toggleButtons[component], status);
            }
        });
    }
});

// Initializing user and button states on socket connection
socket.on('connect', () => {
    console.log('Socket connected successfully');
    socket.emit('init-user', { id: 'USER' });
});