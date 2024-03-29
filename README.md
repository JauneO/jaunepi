# Raspberry Pi System Configuration and Packages Setup

## System Configuration

1. Enable VNC:
   ```bash
   sudo raspi-config
   ```
   - Enable VNC
   - Enable I2C

2. Hold realvnc-vnc-server package version:
   ```bash
   sudo apt-mark hold realvnc-vnc-server
   ```

3. Update and upgrade packages, then reboot:
   ```bash
   sudo apt update
   sudo apt upgrade
   sudo reboot
   ```

4. Edit the config.txt file:
   ```bash
   sudo nano /boot/firmware/config.txt
   ```
   - Add the line: `disable_camera_led=1`

5. Install libcamera-v4l2 and motion:
   ```bash
   sudo apt-get install libcamera-v4l2
   sudo apt install motion
   ```

6. Edit motion.conf:
   ```bash
   sudo nano /etc/motion/motion.conf
   ```
   - Set the daemon option to on if you want Motion to run in the background.
   - Set the stream_localhost and webcontrol_localhost options to off.
   - Configure ports (8088 and 8089).
   - Specify the target_dir.

## Packages Installation

- Install Node.js dependencies:
  ```bash
  npm i
  npm install onoff
  npm install i2c-bus
  ```

- Install Python dependencies within virtual environment:
  ```bash
  pip install flask
  pip install flask-cors
  pip install rpi_ws281x
  ```

## Start/Reset Servers

- Execute the start_servers.sh script located in Documents :
  ```bash
  ./start_servers.sh
  ```


## Documentation 

   - RPi IR-CUT Camera DataSheet : https://www.uctronics.com/download/Amazon/B003503.pdf
   - RPi IR-CUT Camera Tutorial : https://www.waveshare.com/wiki/RPi_IR-CUT_Camera
   - Fix : https://forums.raspberrypi.com/viewtopic.php?t=358211
   - Motion : https://motion-project.github.io/index.html
   - Motion API : https://www.lavrsen.dk/foswiki/bin/view/Motion/MotionHttpAPI
   - WS291x Python Package : https://github.com/rpi-ws281x/rpi-ws281x-python
