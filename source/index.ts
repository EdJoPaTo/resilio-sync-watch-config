#!/usr/bin/env node

import cli from 'cli'

import {onlyParseFile, runWithSpecificFiles} from './runmode'

import {ResilioLifecycle} from './resilio'

cli.enable('version')
cli.setUsage(cli.app + ' [options] config.json')
cli.parse({
  resilioBin: ['b', 'Binary of Resilio. Can be used if rslsync is not in PATH.', 'file', 'rslsync'],
  start: ['s', 'Start resilio sync after config generation'],
  watchmode: ['w', 'Watch config changes and restart Resilio Sync on change. Implies -s']
})

if (cli.options.watchmode) {
  cli.options.start = true
}

let shutdown = false

if (cli.args.length === 0) { // Can not be the configFilePaths
  cli.getUsage()
  process.exit(1)
}

const configFilePaths = cli.args

doStuff()
async function doStuff(): Promise<void> {
  if (!cli.options.start && !cli.options.watchmode) {
    const resilioConfigFilePath = 'sync.conf'
    await onlyParseFile(configFilePaths, resilioConfigFilePath, true)
  }

  if (cli.options.start) {
    const resilio = await runWithSpecificFiles(configFilePaths, cli.options.watchmode, cli.options.resilioBin)

    process.on('SIGINT', () => handleExitRequest(resilio))
    process.on('SIGTERM', () => handleExitRequest(resilio))
  }
}

function handleExitRequest(resilio: ResilioLifecycle): void {
  console.log('exit request received.')
  if (shutdown) {
    console.log('Force stop…')
    process.exit(1)
  } else {
    shutdown = true
    resilio.stop()
  }
}
