#!/usr/bin/env node

const {execFileSync} = require('child_process')
const fs = require('fs')

const cli = require('cli')

const parseConfig = require('./parse-config')
const ResilioLifecycle = require('./resilio-lifecycle')

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

const resilio = new ResilioLifecycle(cli.options.resilioBin, resilioConfigFilePath, cleanup)

resilio.start()
process.on('SIGINT', () => handleExitRequest())
process.on('SIGTERM', () => handleExitRequest())

if (cli.options.watchmode) {
  console.log('watch', configFilePath)
  let lastChange = 0
  fs.watchFile(configFilePath, () => {
    setTimeout(id => {
      if (id === lastChange) {
        handleChange(configFilePath, resilioConfigFilePath)
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

async function handleChange(configFilePath, resilioConfigFilePath) {
  parseConfigFile(configFilePath, resilioConfigFilePath)
  await resilio.restart()
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

    fs.rmdirSync(tmpFolder)
  }
  // The fs.watcher is still watching and has to be stopped
  process.exit(0)
}
