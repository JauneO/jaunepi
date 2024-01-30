#!/bin/bash

# Home directory
home_directory=~

# Directories where the servers are located
server_directory1="Documents/led-control-v4"
server_directory2="Documents/strip-led-server"

# List of server process names and startup commands
server_processes=(
  "node server"
  "sudo node robot-client"
  "sudo libcamerify motion"
  "sudo env/bin/python server.py"
)

# Kill existing processes
for process in "${server_processes[@]}"; do
  echo "Killing existing process: $process"
  pkill -f "$process"
done

# List of server startup commands
server_commands=(
  "cd $home_directory/$server_directory1 && nohup node server > server.log 2>&1 &"
  "cd $home_directory/$server_directory1 && nohup sudo node robot-client > robot-client.log 2>&1 &"
  "nohup sudo libcamerify motion > motion.log 2>&1 &"
  "cd $home_directory/$server_directory2 && source env/bin/activate && nohup sudo env/bin/python server.py > server.log 2>&1 &"
)

# Loop through each command and start the server
for command in "${server_commands[@]}"; do
  echo "Starting server with command: $command"
  eval $command
done

echo "All servers started successfully."
