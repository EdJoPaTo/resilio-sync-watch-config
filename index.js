#!/usr/bin/env node

const {execFileSync} = require('child_process')
const fs = require('fs')

const cli = require('cli')

const parseConfig = require('./parse-config')
const Resilio = require('./resilio-sync.js')

cli.enable('version')
cli.setUsage(cli.app + ' [options] config.json')
cli.parse({
  resilioBin: ['b', 'Binary of Resilio. Can be used if rslsync is not in PATH.', 'file', 'rslsync'],
  start: ['s', 'Start resilio sync after config generation'],
  watchmode: ['w', 'Watch config changes and restart Resilio Sync on change. Implies -s']
})

let shutdown = false
let tmpFolder

if (cli.args.length !== 1) { // Can not be the configFilePath
  cli.getUsage()
  process.exit(1)
}
const configFilePath = cli.args[0]

let resilioConfigFilePath
if (cli.options.start || cli.options.watchmode) {
  tmpFolder = fs.mkdtempSync('/tmp/resilio-sync-watch-config-')
  resilioConfigFilePath = tmpFolder + '/sync.conf'
} else {
  resilioConfigFilePath = 'sync.conf'
}

parseConfigFile(configFilePath, resilioConfigFilePath)

// Only continue when something wants to start resilio
if (!cli.options.start && !cli.options.watchmode) {
  process.exit(0)
}

const resilio = new Resilio(cli.options.resilioBin, resilioConfigFilePath)

startResilio(resilio, cli.options.watchmode)
process.on('SIGINT', () => handleExitRequest(resilio))
process.on('SIGTERM', () => handleExitRequest(resilio))

if (cli.options.watchmode) {
  console.log('watch', configFilePath)
  let lastChange = 0
  fs.watchFile(configFilePath, () => {
    setTimeout(id => {
      if (id === lastChange) {
        handleChange(resilio, configFilePath, resilioConfigFilePath)
      }
    }, 100, ++lastChange)
  })
}

function parseConfigFile(inputFilename, outputFilename) {
  try {
    console.log('generate config…')
    const contentString = fs.readFileSync(inputFilename, 'utf8')
    const content = JSON.parse(contentString)
    const resilioConfig = parseConfig(content)
    fs.writeFileSync(outputFilename, JSON.stringify(resilioConfig, null, '  '), 'utf8')
    execFileSync('mkdir', ['-p', resilioConfig.storage_path])
  } catch (err) {
    console.error('generate config failed:', err)
  }
}

function startResilio(resilio, watchmode) {
  if (shutdown) {
    cleanup()
  }
  const callback = watchmode ? resilioOnWatchmodeClose : null
  resilio.start(callback, resilio)
}

function resilioOnWatchmodeClose(code, resilio) {
  if (shutdown) {
    cleanup()
  }
  setTimeout(resilio => startResilio(resilio, true), 5000, resilio)
}

function handleChange(resilio, configFilePath, resilioConfigFilePath) {
  console.log('Stop Resilio Sync…')
  resilio.stop()
  parseConfigFile(configFilePath, resilioConfigFilePath)
}

function handleExitRequest() {
  console.log('exit request received.')
  if (shutdown) {
    console.log('Force stop…')
    process.exit(1)
  } else {
    shutdown = true
    console.log('Stop Resilio…')
    resilio.stop()
  }
}

function cleanup() {
  if (tmpFolder) {
    try {
      fs.unlinkSync(tmpFolder + '/sync.conf')
    } catch (err) {}

    fs.rmdirSync(tmpFolder)
  }
  process.exit(0)
}
