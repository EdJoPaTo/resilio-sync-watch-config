# Resilio Sync Watch Config

[![Build Status](https://travis-ci.org/EdJoPaTo/resilio-sync-watch-config.svg?branch=master)](https://travis-ci.org/EdJoPaTo/resilio-sync-watch-config)
[![Dependency Status](https://david-dm.org/edjopato/resilio-sync-watch-config/status.svg)](https://david-dm.org/edjopato/resilio-sync-watch-config)
[![Dependency Status](https://david-dm.org/edjopato/resilio-sync-watch-config/dev-status.svg)](https://david-dm.org/edjopato/resilio-sync-watch-config?type=dev)

This tool was created to support the [Resilio Sync Home](//www.resilio.com/individuals/) software on headless devices.

## Install

Just install it globally with npm:

```sh
npm i -g resilio-sync-watch-config
```

## Usage

```sh
resilio-sync-watch-config [options] config.json

options:
-s	Start Resilio Sync after config generation
-w	Watch config. Restart Resilio Sync when changed. Implies -s
```

Multiple config.json are possible in order to combine multiple configs into one

### systemd Service

Instructions for this are in the subfolder `systemd`

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
