#!/bin/sh

# copy stuff
sudo cp -uv *.service /etc/systemd/system

# reload systemd
sudo systemctl daemon-reload

# start or enable systemd service
sudo systemctl enable resilio-sync-watch-config.service
sudo systemctl start resilio-sync-watch-config.service
