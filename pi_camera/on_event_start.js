#!/bin/bash

# Your actions or commands to be executed when an event starts
echo "Event started at $(date)" >> /home/jaune/Documents/pi_camera/log.txt

curl -X POST http://localhost:8080/api/on_event_start