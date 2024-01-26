// a faire sudo pour le faire et installation pigpio
const io = require('socket.io-client');
const Gpio = require('onoff').Gpio;
const pigpio = require('pigpio');
//use your server IP if it runs separately!
const socket = io('http://localhost:8080', { path: '/api/socket' });

const ledStatusMap = {
    jaune: false,
    green: false,
    blue: false,
    servo : false,
};

const jauneLed = new Gpio(19, 'out');
const greenLed = new Gpio(26, 'out');
const blueLed = new Gpio(13, 'out');
const servomotor = new pigpio.Gpio(21, { mode: pigpio.Gpio.OUTPUT });
//let servomotorLock = false;

socket.on('message-from-client', message => {
    switch (message.led) {
        case 'jaune':
            ledStatusMap.jaune = !ledStatusMap.jaune;
            break;
        case 'green':
            ledStatusMap.green = !ledStatusMap.green;
            break;
        case 'blue':
            ledStatusMap.blue = !ledStatusMap.blue;
            break;
    };
    
    switch (message.type) {
        case 'rotate-servomotor':                
            ////Si le type de message est "rotate-servomotor"
            //// Faire tourner le servomoteur sans spécifier un angle particulier
            ////// Vous pouvez ajuster cela en fonction de votre servomoteur
            servomotor.servoWrite(2000);// activer le servomoteur
            console.log("jaw")

            ////// Attendez un moment (par exemple, 1000 ms) avant de désactiver le servomoteur
            setTimeout(() => {  
                servomotor.servoWrite(1500); 
                console.log("nein")// désactiver le servomoteur
             }, 2000);

            break;
        }
        ////
        
    // Set pins by map
	jauneLed.writeSync(ledStatusMap.jaune ? 1 : 0);
	greenLed.writeSync(ledStatusMap.green ? 1 : 0);
	blueLed.writeSync(ledStatusMap.blue ? 1 : 0);
    socket.emit('message-from-robot', { ledStatusMap, to: 'USER' });
});


socket.on('motion-detected', () => {
    console.log('Motion detected event received by robot-client');
    socket.emit('motion-detected', { message: 'Motion detected!' });
    console.log('Motion detected event emitted to clients');
});

socket.on('connect', () => {
    socket.emit('init-robot', { id: 'ROBOT' });
});


