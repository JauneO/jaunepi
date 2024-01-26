#!/bin/bash

# Your actions or commands to be executed when an event starts
echo "Motion detected!" >> /home/jaune/Documents/pi_camera/log.txt

curl -X POST http://localhost:8080/api/motion-detected