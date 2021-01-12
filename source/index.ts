#!/usr/bin/env node

import * as fs from 'fs'

/* eslint import/no-unassigned-import: off */
import 'source-map-support/register'

import {ResilioSync} from 'resilio-sync'
import cli from 'cli'

import {onlyParseFile, runWithSpecificFiles, runWithShareKey} from './runmode'
import {ResilioWithOwnConfigs} from './resilio'

const {readFile} = fs.promises

interface CliOptions {
  start?: boolean;
  readonly basedir?: string;
  readonly key?: string;
  readonly keyfile?: string;
  readonly resilioBin?: string;
  readonly watchmode?: boolean;
}

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

let {start} = cli.options as CliOptions
const {basedir, key, keyfile, resilioBin, watchmode} = cli.options as CliOptions
const configFilePaths = cli.args

if (watchmode) {
  start = true
}

let shutdown = false

async function doStuff(): Promise<void> {
  // When there is no key(file) of a share with configs and no configs passed via arguments
  if (cli.args.length === 0 && !key && !keyfile) {
    cli.getUsage()
    process.exit(1)
  }

  // When there is a key(file) the configs are in it, not given via arguments
  if ((key || keyfile) && configFilePaths.length > 0) {
    cli.getUsage()
    process.exit(1)
  }

  // When there is a key(file), there has to be a basedir. If not, there shouldnt be a basefile
  if ((key || keyfile) ? !basedir : basedir) {
    cli.getUsage()
    process.exit(1)
  }

  if (!start && !watchmode && !key && !keyfile) {
    const resilioConfigFilePath = '/dev/stdout'
    await onlyParseFile(configFilePaths, resilioConfigFilePath, true)
    return
  }

  try {
    const resilio = new ResilioWithOwnConfigs(
      new ResilioSync(resilioBin)
    )
    process.on('SIGINT', () => {
      handleExitRequest(resilio)
    })
    process.on('SIGTERM', () => {
      handleExitRequest(resilio)
    })

    if (key && basedir) {
      await runWithShareKey(resilio, basedir, key)
    } else if (keyfile && basedir) {
      const shareKey = await readFile(keyfile, 'utf8')
      await runWithShareKey(resilio, basedir, shareKey.trim())
    } else if (start) {
      await runWithSpecificFiles(resilio, configFilePaths, Boolean(watchmode))
    }
  } catch (error: unknown) {
    console.error('error on startup', error)
  }
}

function handleExitRequest(stoppable: {readonly stop: () => void}): void {
  console.log('exit request received.')
  if (shutdown) {
    console.log('Force stop…')
    process.exit(1)
  } else {
    shutdown = true
    stoppable.stop()
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
doStuff()
