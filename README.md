# Raspberry Pi System Configuration and Packages Setup

## System Configuration

1. Enable VNC:
   ```bash
   sudo raspi-config
   ```
   - Enable VNC

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

- Install Python dependencies:
  ```bash
  pip install Flask
  pip install rpi_ws281x
  ```

## Start/Reset Servers

- Execute the start_servers.sh script:
  ```bash
  ./start_servers.sh
  ```
