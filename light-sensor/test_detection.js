const i2c = require('i2c-bus');
const Gpio = require('onoff').Gpio;

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

// GPIO pour la LED
const ledPin = 26;
const led = new Gpio(ledPin, 'out');

// Crée une instance de bus I2C
const i2c1 = i2c.openSync(1);  // Utilisez le bon numéro de bus (1 ou 20)

// Configuration du capteur
i2c1.writeByteSync(DEVICE_ADDRESS, ENABLE, 0x03);  // Active la proximité et la mesure de la lumière
i2c1.writeByteSync(DEVICE_ADDRESS, ATIME, 0xFF);    // Temps d'intégration maximal
i2c1.writeByteSync(DEVICE_ADDRESS, CONTROL, 0x0D);  // Gain x1 et mode de mesure

function readProximity() {
    // Lit la valeur de proximité du capteur
    const proximityData = i2c1.readWordSync(DEVICE_ADDRESS, PDATAL);
    return proximityData & 0xFF;
}

function readLuminosity() {
    // Lit la valeur de luminosité du capteur
    const luminosityData = i2c1.readWordSync(DEVICE_ADDRESS, CDATAL);
    return luminosityData;
}

function mainLoop() {
    try {
        const proximityValue = readProximity();
        const luminosityValue = readLuminosity();

        console.log(`Proximité: ${proximityValue}, Luminosité: ${luminosityValue}`);

        if (luminosityValue < 9 && proximityValue < 11) {
            // Allumer la LED
            led.writeSync(1);
        } else {
            // Éteindre la LED
            led.writeSync(0);
        }

        setTimeout(mainLoop, 1000); // Appelle la fonction mainLoop après une seconde
    } catch (error) {
        console.error('Erreur:', error.message);
        led.writeSync(0);  // Assurez-vous que la LED est éteinte en cas d'erreur
    }
}

// Démarrer la boucle principale
mainLoop();

// Ajoutez ceci pour libérer la ressource GPIO lors de l'arrêt du programme
process.on('SIGINT', () => {
    led.unexport();
    i2c1.closeSync();
    console.log('Arrêt du programme.');
    process.exit();
});
