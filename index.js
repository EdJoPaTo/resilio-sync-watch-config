#!/usr/bin/env node

const fs = require('fs')

const cli = require('cli')

const ResilioLifecycle = require('./src/resilio-lifecycle')
const ConfigFileHandler = require('./src/config-file-handler')

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
let tmpFolder

if (cli.args.length === 0) { // Can not be the configFilePaths
  cli.getUsage()
  process.exit(1)
}
const configFilePaths = cli.args

let resilioConfigFilePath
if (cli.options.start || cli.options.watchmode) {
  tmpFolder = fs.mkdtempSync('/tmp/resilio-sync-watch-config-')
  resilioConfigFilePath = tmpFolder + '/sync.conf'
} else {
  resilioConfigFilePath = 'sync.conf'
}

const configFileHandler = new ConfigFileHandler(configFilePaths, resilioConfigFilePath)
const resilio = new ResilioLifecycle(cli.options.resilioBin, resilioConfigFilePath, cleanup)

doStuff()
async function doStuff() {
  await configFileHandler.generateResilioConfig(true, true)

  // Only continue when something wants to start resilio
  if (!cli.options.start && !cli.options.watchmode) {
    return
  }

  resilio.start()
  process.on('SIGINT', () => handleExitRequest())
  process.on('SIGTERM', () => handleExitRequest())

  if (cli.options.watchmode) {
    configFileHandler.watch(async () => {
      await configFileHandler.generateResilioConfig(true, true)
      await resilio.restart()
    })
  }
}

function handleExitRequest() {
  console.log('exit request received.')
  if (shutdown) {
    console.log('Force stop…')
    process.exit(1)
  } else {
    shutdown = true
    resilio.stop()
  }
}

function cleanup() {
  if (tmpFolder) {
    try {
      fs.unlinkSync(tmpFolder + '/sync.conf')
    } catch (err) {}

    try {
      fs.rmdirSync(tmpFolder)
    } catch (err) {}
  }
}
