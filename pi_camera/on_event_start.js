#!/bin/bash

# Your actions or commands to be executed when an event starts
echo "Event started at $(date)" >> /home/jaune/Documents/pi_camera/log.txt

# Update motionAPI.json
echo '{"event": "start"}' > /home/jaune/Documents/pi_camera/motionAPI.json
