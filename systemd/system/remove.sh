#!/usr/bin/env bash

name="resilio-sync-watch-config"

sudo systemctl disable --now "$name.service"

sudo rm -f "/usr/local/lib/systemd/system/$name.service"
sudo rm -f "/usr/local/bin/$name"

sudo systemctl daemon-reload
