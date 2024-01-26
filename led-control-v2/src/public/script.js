import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

//our socket
//use your server IP!
const socket = io('http://192.168.0.193:8080', { path: '/api/socket/' });

//let's find our buttons
const jauneLedButton = document.getElementById('jaune-button');
const blueLedButton = document.getElementById('blue-button');
const greenLedButton = document.getElementById('green-button');
const servoButton = document.getElementById('servo-button'); // new//



//let's find our leds
const jauneLed = document.getElementById('jaune').getElementsByClassName ('Led')[0];
const greenLed = document.getElementById('green').getElementsByClassName('Led')[0];
const blueLed = document.getElementById('blue').getElementsByClassName('Led')[0];

const servomotorContainer = document.getElementById('servomotor');
const servomotor = servomotorContainer.getElementsByClassName('Led')[0];


const handleLedChange = (led) => {
    socket.emit('message-from-client', { to: 'ROBOT', type: 'change-led', led });
};

jauneLedButton.onclick = () => handleLedChange('jaune');
blueLedButton.onclick = () => handleLedChange('blue');
greenLedButton.onclick = () => handleLedChange('green');

let servomotorActive = false;
servoButton.onclick = () => {
    if (!servomotorActive) {
       servomotorActive= true;
       
    
    // Envoyer un message au serveur pour indiquer le besoin de régler le servomoteur à 90 degrés
        socket.emit('message-from-client', { to: 'ROBOT', type: 'rotate-servomotor' });
        //servomotor.classList.remove('LedOn');
        servomotor.classList.add('LedOnGreen');
        setTimeout(() => {
            
            servomotorActive = false;
            servomotor.classList.remove('LedOnGreen');
            //servomotor.classList.add('LedOff');
        }, 2000); // 2000 ms ici, ajustez-le en fonction de vos besoins
    }
};


socket.on('message-from-robot', ({ ledStatusMap }) => {
    ledStatusMap.jaune ? jauneLed.classList.add('LedOn') : jauneLed.classList.remove('LedOn');
    ledStatusMap.green ? greenLed.classList.add('LedOn') : greenLed.classList.remove('LedOn');
    ledStatusMap.blue ? blueLed.classList.add('LedOn') : blueLed.classList.remove('LedOn');
    //ledStatusMap.servo ? servomotor.classList.add('LedOn') : servomotor.classList.remove('LedOn')
    //ledStatusMap.servo ? servomotor.classList.add('ServoOn') : servomotor.classList.remove('ServoOn');
});

// Variable to store motion detection status
let motionDetected = false;

// Initial call to start checking for motion
updateStatus(motionDetected);

// Listen for the 'motion-detected' event from the server
socket.on('motion-detected', (message) => {
    console.log('Motion detected event received from server:', message.message);

    // Update motion detection status
    motionDetected = true;

    // Update the status on the HTML page
    updateStatus(motionDetected);
});

socket.on('connect', () => {
    socket.emit('init-user', { id: 'USER' });
})


