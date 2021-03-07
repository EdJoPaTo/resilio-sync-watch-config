# Resilio Sync Watch Config

[![Docker Hub Image](https://img.shields.io/docker/image-size/edjopato/resilio-sync-watch-config)](https://hub.docker.com/r/edjopato/resilio-sync-watch-config)

This tool was created to support the [Resilio Sync Home](//www.resilio.com/individuals/) software on headless devices.

## Install

### Prebuilt

Check the [Releases](https://github.com/EdJoPaTo/resilio-sync-watch-config/releases).

### From Source

- Clone this repository
- `cargo install --path .`

### Docker container

Use the [Docker Image](https://hub.docker.com/r/edjopato/resilio-sync-watch-config).

Provide the secret `/run/secrets/share.txt` or override `/share.txt` with the share you want to sync.
Environment variables are currently not supported (but that can change when someone wants to use that).

Example compose file for `single` folder syncing:

```yml
version: '3.7'

secrets:
  share.txt:
    file: secrets/resilio-share.txt

volumes:
  share:
  workdir:

services:
  watch-config:
    image: edjopato/resilio-sync-watch-config:3
    secrets:
      - share.txt
    volumes:
      - share:/folders/single
      - workdir:/.resilio-sync-watch-config
```

Example compose file for `watch` mode syncing:

```yml
version: '3.7'

secrets:
  share.txt:
    file: secrets/resilio-share.txt

volumes:
  folders:
  workdir:

services:
  watch-config:
    image: edjopato/resilio-sync-watch-config:3
    command: watch --cleanup
    secrets:
      - share.txt
    volumes:
      - folders:/folders
      - workdir:/.resilio-sync-watch-config
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

## Usage

```plaintext
Resilio Sync Watch Config 3.0.0
EdJoPaTo <resilio-sync-watch-config-rust@edjopato.de>
Small tool to create a resilio config and watch for changes to restart the sync daemon
on changes

USAGE:
    resilio-sync-watch-config [OPTIONS] <SUBCOMMAND>

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -b, --basedir <DIRECTORY>    Folder in which the resulting share(s) should be synced
                                 [default: folders]

SUBCOMMANDS:
    help      Prints this message or the help of the given subcommand(s)
    parse     Reads (multiple) own JSON config files and prints the resulting
              Resilio config to stdout
    single    Sync a single share with Resilio
    watch     Provide Resilio with a share secret which contains own config files.
              These are parsed into a Resilio config and Resilio is started with it.
              The config files in the share are watched and Resilio is restarted on
              changes.
```

### Single Mode

```plaintext
Sync a single share with Resilio

USAGE:
    resilio-sync-watch-config single [FLAGS] [OPTIONS] <SECRET_OR_FILE>

FLAGS:
    -h, --help            Prints help information
        --enable-trash    Enable rslsync trash (use_sync_trash: true). Defaults to not
                          using sync trash (different to default rslsync)
    -V, --version         Prints version information

OPTIONS:
    -b, --basedir <DIRECTORY>    Folder in which the resulting share(s) should be synced
                                 [default: folders]

ARGS:
    <SECRET_OR_FILE>    Share secret to be synced. Can be the secret itself or a
                        filename which contains the secret [default:
                        share.txt]
```

### Watch Mode

```plaintext
Provide Resilio with a share secret which contains own config files. These are parsed
into a Resilio config and Resilio is started with it. The config files in the share are
watched and Resilio is restarted on changes.

USAGE:
    resilio-sync-watch-config watch [FLAGS] [OPTIONS] <SECRET_OR_FILE>

FLAGS:
        --cleanup
            remove superfluous folders. Folders which are not included in the current
            config are deleted after the current config is running successfully for 5
            minutes.
    -h, --help
            Prints help information

    -s, --safe-start
            clean all state of Resilio before starting. Ensures old runs of Resilio dont
            influence the correct syncing. Basically removes the storage_path. This is
            helpful when switching the share key. Only the first start of Resilio will
            be done with safe-mode. When Resilio stops/crashes when it shouldnt safe-
            mode is enabled for the next start regardless of this flag.
    -V, --version
            Prints version information


OPTIONS:
    -b, --basedir <DIRECTORY>
            Folder in which the resulting share(s) should be synced [default:
            folders]

ARGS:
    <SECRET_OR_FILE>
            Share secret to be synced which contains the own configs. Can be the secret
            itself or a filename which contains the secret [default: share.txt]
```

### Parse

```
Reads (multiple) own JSON config files and prints the resulting Resilio config to stdout

USAGE:
    resilio-sync-watch-config parse [OPTIONS] <FILE>...

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -b, --basedir <DIRECTORY>    Folder in which the resulting share(s) should be synced
                                 [default: folders]

ARGS:
    <FILE>...    Path(s) to own JSON config files
```

## systemd Service

Instructions for this are in the subfolder [`systemd`](systemd)
