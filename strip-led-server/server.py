from flask import Flask, request
from flask_cors import CORS
import time
from rpi_ws281x import PixelStrip, Color
import threading
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# LED strip configuration:
LED_COUNT = 140
LED_PIN = 18
LED_FREQ_HZ = 800000
LED_DMA = 10
DEFAULT_BRIGHTNESS = 125
DEFAULT_COLOR = Color(255, 255, 255)
LED_INVERT = False

# Global variables for sunrise and sunset colors
DEFAULT_BRIGHTNESS

sunrise_start_color = (255, 69, 0)
sunrise_end_color = (255, 230, 180)

sunset_start_color = (255, 255, 255)
sunset_end_color = (255, 69, 0)

# Create NeoPixel object with appropriate configuration.
strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, DEFAULT_BRIGHTNESS)
# Initialize the library (must be called once before other functions).
strip.begin()

# Set up the stop event for the thread
stop_event = threading.Event()

# Global variable for rainbow thread
rainbow_thread = None

# Function for rainbow cycling
def rainbow_cycle(strip, wait_ms=20):
    while not stop_event.is_set():
        for j in range(255):
            for i in range(strip.numPixels()):
                if stop_event.is_set():
                    return
                strip.setPixelColor(i, wheel((i + j) & 255))
            strip.show()
            time.sleep(wait_ms / 1000.0)
     
# Function to smoothly cycle through the colors of the rainbow
def wheel(pos):
    if pos < 85:
        return Color(pos * 3, 255 - pos * 3, 0)
    elif pos < 170:
        pos -= 85
        return Color(255 - pos * 3, 0, pos * 3)
    else:
        pos -= 170
        return Color(0, pos * 3, 255 - pos * 3)


def set_color_for_all_pixels(strip, color):
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
       
        
# Turn on all LEDs with a specific color
def turn_on(strip, color=None):
    strip.setBrightness(DEFAULT_BRIGHTNESS)
    if color is not None:
        set_color_for_all_pixels(strip, color)
        strip.setBrightness(DEFAULT_BRIGHTNESS)
    strip.show()


# Turn off all LEDs
def turn_off(strip):
    strip.setBrightness(0)
    strip.show()


# Set the brightness of the LED strip
def set_brightness(brightness):
    brightness = max(1, min(255, brightness))
    strip.setBrightness(brightness)
    strip.show()


# Parse RGB color parameters from the request
def parse_color_parameters(request):
    red = int(request.args.get('red', 0))
    green = int(request.args.get('green', 0))
    blue = int(request.args.get('blue', 0))
    return Color(red, green, blue)


# Linear interpolation function for colors
def lerp_color(color_start, color_end, alpha):
    r = int((1 - alpha) * color_start[0] + alpha * color_end[0])
    g = int((1 - alpha) * color_start[1] + alpha * color_end[1])
    b = int((1 - alpha) * color_start[2] + alpha * color_end[2])
    
    return Color(r, g, b)


# Function to smoothly transition between colors
def color_transition(strip, color_start, color_end, duration_ms):
    steps = 50
    delay = duration_ms / steps

    for step in range(steps + 1):
        alpha = step / steps
        color = lerp_color(color_start, color_end, alpha)
        turn_on(strip, color)
        time.sleep(delay / 1000.0)
    
    strip.show()


def lerp_color_brightness_duration(strip, color_start, color_end, brightness_start, brightness_end, duration_ms):
    steps = 1000
    delay = duration_ms / steps
    
    brightness_values = [
        int((1 - alpha) * brightness_start + alpha * brightness_end)
        for alpha in (step / steps for step in range(steps + 1))
    ]

    for step, brightness in zip(range(steps + 1), brightness_values):
        alpha = step / steps
        color = lerp_color(color_start, color_end, alpha)
        print(f"Step: {step}, Alpha: {alpha}, Brightness: {brightness}, Color: {color}")
        set_brightness(brightness)
        set_color_for_all_pixels(strip, color)
        time.sleep(delay/ 1000.0)
        
    strip.show()


# Function to create a random color pattern for a party effect
def party_pattern(strip, duration_ms=30 * 1000):
    steps = int(duration_ms / 50)
    for _ in range(steps):
        if stop_event.is_set():
            break  # Exit the loop if stop event is set

        random_color = Color(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        turn_on(strip, random_color)
        time.sleep(0.05)

    turn_off(strip)

        
def colorBounce(strip, color1, color2, wait_ms=50, iterations=5):
    for j in range(iterations):
        for i in range(strip.numPixels()):
            if i % 2 == 0:
                strip.setPixelColor(i, Color(color1[0],
                    color1[1],color1[2]))
            else:
                strip.setPixelColor(i, Color(color2[0],
                    color2[1],color2[2]))
        strip.show()
        time.sleep(wait_ms / 1000.0)


def fadeInOut(strip, color, wait_ms=50, iterations=5):
    for j in range(iterations):
        for i in range(256):
            for k in range(strip.numPixels()):
                strip.setPixelColor(k, (
                    Color(
                    int(color[0] * i / 255),
                    int(color[1] * i / 255),
                    int(color[2] * i / 255))
                ))
            strip.show()
            time.sleep(wait_ms / 1000.0)
        for i in range(255, -1, -1):
            for k in range(strip.numPixels()):
                strip.setPixelColor(k, (
                    Color(
                    int(color[0] * i / 255),
                    int(color[1] * i / 255),
                    int(color[2] * i / 255))
                ))
            strip.show()
            time.sleep(wait_ms / 1000.0)



# Main route
@app.route('/')
def hello():
    return 'Hello, World!'

# Lights on route
@app.route('/on')
def lights_on():
    turn_on(strip)
    return 'Lights ON!'

# Lights off route
@app.route('/off')
def lights_off():
    turn_off(strip)
    return 'Lights OFF!'

# Set brightness route
@app.route('/set_brightness/<int:brightness>')
def set_strip_brightness(brightness):
    set_brightness(brightness)
    return f'Brightness set to {brightness}'

# Set color route
@app.route('/set_color')
def set_strip_color():
    color = parse_color_parameters(request)
    turn_on(strip, color)
    return f'Color set to RGB({color})'

# Daylight Mode route
@app.route('/daylight')
def daylight_mode():
    turn_on(strip, Color(255, 230, 180))  # Warm white color
    return 'Daylight Mode'

# Start the rainbow mode thread
@app.route('/rainbow/start')
def start_rainbow_mode():
    global rainbow_thread
    global stop_event

    if rainbow_thread is None or not rainbow_thread.is_alive():
        stop_event.clear()  # Clear the stop event flag
        rainbow_thread = threading.Thread(target=rainbow_cycle, args=(strip,))
        rainbow_thread.start()
        return 'Rainbow Mode Started'
    else:
        return 'Rainbow Mode is already running'

# Set the stop event to signal the thread to stop
@app.route('/rainbow/stop')
def stop_rainbow_mode():
    global stop_event
    if rainbow_thread is not None and rainbow_thread.is_alive():
        stop_event.set()  # Set the stop event flag
        return 'Rainbow Mode Stopping'
    else:
        return 'Rainbow Mode is not running'
    
# Sunrise Mode route using rainbow effect
@app.route('/sunrise')
def sunrise_mode():
    duration_ms = 1 * 60 * 1000  # 1 minute
    turn_off(strip)
    lerp_color_brightness_duration(strip, sunrise_start_color, sunrise_end_color, 0, 255, duration_ms)
    return 'Sunrise Mode'

# Sunset Mode route
@app.route('/sunset')
def sunset_mode():
    duration_ms = 1 * 60 * 1000  # 1 minute
    lerp_color_brightness_duration(strip, sunset_start_color, sunset_end_color, 125, 0, duration_ms)
    return 'Sunset Mode'

# Random Color Mode route
@app.route('/random_color')
def random_color_mode():
    random_color = Color(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    turn_on(strip, random_color)
    return f'Random Color Mode: RGB({random_color})'

# Party Mode route
@app.route('/party/start')
def start_party_mode():
    party_thread = threading.Thread(target=party_pattern, args=(strip,))
    party_thread.start()
    return 'Party Mode !!!'

@app.route('/party/stop')
def stop_party_mode():
    global stop_event
    stop_event.set()
    return 'Party Mode Stopped'

# Route for Color Bounce
@app.route('/color_bounce')
def route_color_bounce():
    color1 = (255, 0, 0)  # Red
    color2 = (0, 0, 255)  # Blue
    colorBounce(strip, color1, color2)
    return 'Color Bounce Effect'

# Route for Fade In and Out
@app.route('/fade_in_out')
def route_fade_in_out():
    color = (0, 255, 0)  # Green
    fadeInOut(strip, color)
    return 'Fade In and Out Effect'

# Run the Flask app
if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0')
    except KeyboardInterrupt:
        stop_rainbow_mode()  # Stop the rainbow mode before exiting
        turn_off(strip)