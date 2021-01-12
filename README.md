# Resilio Sync Watch Config

[![NPM Version](https://img.shields.io/npm/v/resilio-sync-watch-config.svg)](https://www.npmjs.com/package/resilio-sync-watch-config)
[![node](https://img.shields.io/node/v/resilio-sync-watch-config.svg)](https://www.npmjs.com/package/resilio-sync-watch-config)
[![Dependency Status](https://david-dm.org/edjopato/resilio-sync-watch-config/status.svg)](https://david-dm.org/edjopato/resilio-sync-watch-config)
[![Dev Dependency Status](https://david-dm.org/edjopato/resilio-sync-watch-config/dev-status.svg)](https://david-dm.org/edjopato/resilio-sync-watch-config?type=dev)
[![Docker Hub Image](https://images.microbadger.com/badges/image/edjopato/resilio-sync-watch-config.svg)](https://microbadger.com/images/edjopato/resilio-sync-watch-config)

This tool was created to support the [Resilio Sync Home](//www.resilio.com/individuals/) software on headless devices.

## Install locally

Just install it globally with npm:

```sh
npm i -g resilio-sync-watch-config
```

## Usage

```sh
resilio-sync-watch-config [options] config.json
Usage:
  index.js [options] config.json

Options:
  -b, --resilioBin [FILE]Binary of Resilio. Can be used if rslsync is not in
                         PATH.  (Default is rslsync)
  -s, --start BOOL       Start resilio sync after config generation
  -w, --watchmode BOOL   Watch config changes and restart Resilio Sync on
                         change. Implies -s
  -k, --key STRING       Key of Resilio Sync Share which contains configs to
                         load. Should be read-only key. Implies -sw and
                         requires --basedir
  -f, --keyfile FILE     File containing the key of a Resilio Sync Share. See
                         --key
  -b, --basedir DIR      Basedir used to sync Resilio Sync Share into. See
                         --key
  -v, --version          Display the current version
  -h, --help             Display help and usage details
```

Multiple config.json are possible in order to combine multiple configs into one.
When using `--key` or `--keyfile` every `*.json` directly placed into the shared folder is combined and used.

### systemd Service

Instructions for this are in the subfolder `systemd`

## Install via docker

Use the [Docker Image](https://hub.docker.com/r/edjopato/resilio-sync-watch-config) inside a Docker Swarm.
Provide the secret `/run/secrets/resilio-share.txt` which will be used as `--keyfile`.

See [Usage](#Usage) and the Dockerfile CMD for more info what happens there.

Example compose file which is deployed as a docker stack:

```yml
version: '3.7'

secrets:
  resilio-share.txt:
    file: secrets/resilio-share.txt

volumes:
  folders:

services:
  watch-config:
    image: edjopato/resilio-sync-watch-config:2
    secrets:
      - resilio-share.txt
    volumes:
      - folders:/folders
```

## Backstory

In my case I dont want to use the webgui so I created config files with the folders in it.
Nearly every entry has the same content so it was much of a copy paste process to add something.
With the config staying inside an sync folder to be edited on my local computer I had to connect to the remote servers and restart resilio manually.

So i needed an abstraction of a config that will be parsed and restarts Resilio Sync when its changed.
So I created this tool.

## Config

The config is a simple json file.


```json
{
  "basedir": "/path/to/resilio/base/folder/",
  "folders": {
    "uniStuff": "<key>",
    "homeStuff": "<key>",
    "tmp": "<key>"
  },
  "passthrough": {
    "folder_defaults.use_lan_broadcast": false,
    "sync_trash_ttl": 1,
    "use_upnp": false
  }
}
```

This config will lead to the following output config:

```json
{
  "device_name": "hostname",
  "storage_path": "/path/to/resilio/base/folder/.sync",
  "shared_folders": [
    {
      "dir": "/path/to/resilio/base/folder/uniStuff",
      "secret": "<key>"
    },
    {
      "dir": "/path/to/resilio/base/folder/homeStuff",
      "secret": "<key>"
    },
    {
      "dir": "/path/to/resilio/base/folder/tmp",
      "secret": "<key>"
    }
  ],
  "folder_defaults.use_lan_broadcast": false,
  "sync_trash_ttl": 1,
  "use_upnp": false
}
```

The `device_name` is generated from the hostname of the running machine.

The input config of this tool (the above one) contains 3 keys: `basedir`, `folders` and `passthrough`.

`basedir` describes the root folder of the synced folders.
It will also contain the `.sync` folder (`storage_path`) for the offical resilio sync config folder.

`folders` contains an object with the names and keys of the folders to be synced.
The folders will be synced to `<basedir>/<foldername>`.
In this case, the tmp folder will be synced to `/path/to/resilio/base/folder/tmp/`.

The `passthrough` key contains an object, that can contain any offical resilio sync config setting.
These settings will override any other settings.
For example will this tool generate the `device_name` key in the resilio config.
if the `device_name` key is set in the passthrough section too, it will override it.
