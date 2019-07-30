#!/usr/bin/env node

import * as fs from 'fs'

/* eslint import/no-unassigned-import: off */
import 'source-map-support/register'

import {ResilioSync} from 'resilio-sync'
import cli from 'cli'

import {onlyParseFile, runWithSpecificFiles, runWithShareKey} from './runmode'
import {ResilioWithOwnConfigs} from './resilio'

const {readFile} = fs.promises

cli.enable('version')
cli.setUsage(cli.app + ' [options] config.json')
cli.parse({
  resilioBin: ['b', 'Binary of Resilio. Can be used if rslsync is not in PATH.', 'file', 'rslsync'],
  start: ['s', 'Start resilio sync after config generation', 'bool'],
  watchmode: ['w', 'Watch config changes and restart Resilio Sync on change. Implies -s', 'bool'],
  key: ['k', 'Key of Resilio Sync Share which contains configs to load. Should be read-only key. Implies -sw and requires --basedir', 'string'],
  keyfile: ['f', 'File containing the key of a Resilio Sync Share. See --key', 'file'],
  basedir: ['b', 'Basedir used to sync Resilio Sync Share into. See --key', 'dir']
})

if (cli.options.watchmode) {
  cli.options.start = true
}

let shutdown = false

const wrongUsage = (cli.args.length === 0 && !cli.options.key && !cli.options.keyfile) ||
  ((cli.options.key || cli.options.keyfile) && cli.args.length > 0) ||
  ((cli.options.key || cli.options.keyfile) ? !cli.options.basedir : cli.options.basedir) // Both or none: key and basedir

if (wrongUsage) {
  cli.getUsage()
  process.exit(1)
}

const configFilePaths = cli.args

doStuff()
async function doStuff(): Promise<void> {
  if (!cli.options.start &&
    !cli.options.watchmode &&
    !cli.options.key &&
    !cli.options.keyfile
  ) {
    const resilioConfigFilePath = '/dev/stdout'
    await onlyParseFile(configFilePaths, resilioConfigFilePath, true)
    return
  }

  try {
    const resilio = new ResilioWithOwnConfigs(
      new ResilioSync(cli.options.resilioBin)
    )
    process.on('SIGINT', () => handleExitRequest(resilio))
    process.on('SIGTERM', () => handleExitRequest(resilio))

    if (cli.options.key) {
      await runWithShareKey(resilio, cli.options.basedir, cli.options.key)
    } else if (cli.options.keyfile) {
      const shareKey = await readFile(cli.options.keyfile, 'utf8')
      await runWithShareKey(resilio, cli.options.basedir, shareKey.trim())
    } else if (cli.options.start) {
      await runWithSpecificFiles(resilio, configFilePaths, cli.options.watchmode)
    }
  } catch (error) {
    console.error('error on startup', error)
  }
}

function handleExitRequest(stoppable: {stop: () => void}): void {
  console.log('exit request received.')
  if (shutdown) {
    console.log('Force stop…')
    process.exit(1)
  } else {
    shutdown = true
    stoppable.stop()
  }
}
