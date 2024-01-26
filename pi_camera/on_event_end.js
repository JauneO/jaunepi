#!/bin/bash

# Your actions or commands to be executed when an event ends
echo "Event ended at $(date)" >> /home/jaune/Documents/pi_camera/log.txt

# Update motionAPI.json
echo '{"event": "None"}' > /home/jaune/Documents/pi_camera/motionAPI.json
