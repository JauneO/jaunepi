### SYSTEM CONFIGURATION ### 

sudo raspi-config
	-enable VNC
sudo apt-mark hold realvnc-vnc-server
sudo apt update
sudo apt upgrade
sudo reboot

sudo nano /boot/firmware/config.txt
	-Add "disable_camera_led=1"

sudo apt-get install libcamera-v4l2
sudo apt install motion
sudo nano /etc/motion/motion.conf
	Set the daemon option to on if you want Motion to run in the background.
	Set the stream_localhost and webcontrol_localhost options to off
	Configure ports (8088 and 8089)
	Specify the target_dir



### PACKAGES ###	
npm i
npm install onoff
npm install i2c-bus

pip install Flask
pip install rpi_ws281x




### START/RESET SERVERS ###
./start_servers.sh
