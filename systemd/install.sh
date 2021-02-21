#!/bin/sh

nice cargo build --release

# systemd stuff
sudo cp -uv *.service /etc/systemd/system
sudo systemctl daemon-reload

# copy to system
sudo systemctl stop resilio-sync-watch-config.service
sudo cp -uv target/release/resilio-sync-watch-config /usr/local/bin/

sudo systemctl enable resilio-sync-watch-config.service
sudo systemctl start resilio-sync-watch-config.service
