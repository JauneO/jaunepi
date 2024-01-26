
from flask import Flask, request
from flask_cors import CORS
import time
from rpi_ws281x import PixelStrip, Color

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# LED strip configuration:
LED_COUNT = 140
LED_PIN = 18
LED_FREQ_HZ = 800000
LED_DMA = 10
DEFAULT_BRIGHTNESS = 255
LED_INVERT = False

# Create NeoPixel object with appropriate configuration.
strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, DEFAULT_BRIGHTNESS)
# Initialize the library (must be called once before other functions).
strip.begin()

def turn_on(strip, color):
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
    strip.show()

def turn_off(strip):
    turn_on(strip, Color(0, 0, 0))
    strip.show()

def set_brightness(brightness):
    # Ensure brightness is between 1 and 255
    brightness = max(1, min(255, brightness))
    strip.setBrightness(brightness)
    strip.show()

def parse_color_parameters(request):
    red = int(request.args.get('red', 0))
    green = int(request.args.get('green', 0))
    blue = int(request.args.get('blue', 0))
    return Color(red, green, blue)

@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/on')
def lights_on():
    turn_on(strip, Color(255, 0, 0))
    time.sleep(5)  # Keep it on for 5 seconds
    return 'Lights ON!'

@app.route('/off')
def lights_off():
    turn_off(strip)
    return 'Lights OFF!'

@app.route('/set_brightness/<int:brightness>')
def set_strip_brightness(brightness):
    set_brightness(brightness)
    return f'Brightness set to {brightness}'

@app.route('/set_color')
def set_strip_color():
    color = parse_color_parameters(request)
    turn_on(strip, color)
    return f'Color set to RGB({color.red}, {color.green}, {color.blue})'

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0')
    except KeyboardInterrupt:
        turn_off(strip)
