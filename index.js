#!/usr/bin/env node

const child_process = require('child_process');
const cli = require('cli');
const fs = require('fs');

const parseConfig = require('./parseConfig.js');
const resilio = require('./resilio-sync.js');

cli.enable('version');
cli.setUsage(cli.app + ' [options] config.json');
cli.parse({
  resilioBin: ['b', 'Binary of Resilio. Can be used if rslsync is not in PATH.', 'file', 'rslsync'],
  start: ['s', 'Start resilio sync after config generation'],
  watchmode: ['w', 'Watch config changes and restart Resilio Sync on change. Implies -s']
});

let shutdown = false;
let tmpFolder;

function parseConfigFile(inputFilename, outputFilename) {
  try {
    console.log('generate config…');
    const contentString = fs.readFileSync(inputFilename, 'utf8');
    const content = JSON.parse(contentString);
    const resilioConfig = parseConfig(content);
    fs.writeFileSync(outputFilename, JSON.stringify(resilioConfig, null, '  '), 'utf8');
    child_process.execFileSync('mkdir', ['-p', resilioConfig.storage_path]);
  } catch (err) {
    console.error('generate config failed:', err);
  }
}

function startResilio(resilioBinary, resilioConfigFilePath, watchmode) {
  if (shutdown) cleanup();
  const callback = watchmode ? resilioOnWatchmodeClose : null;
  resilio.start(resilioBinary, resilioConfigFilePath, callback);
}

function resilioOnWatchmodeClose(code, resilioConfigFilePath) {
  if (shutdown) cleanup();
  setTimeout(resilioConfigFilePath => startResilio(resilioBinary, resilioConfigFilePath, true), 5000, resilioConfigFilePath);
}

function handleChange(configFilePath, resilioConfigFilePath) {
  console.log('Stop Resilio Sync…');
  resilio.stop();
  parseConfigFile(configFilePath, resilioConfigFilePath);
}

function handleExitRequest() {
  console.log('exit request received.');
  if (!shutdown) {
    shutdown = true;
    console.log('Stop Resilio…');
    resilio.stop();
  } else {
    console.log('Force stop…');
    process.exit(1);
  }
}

function cleanup() {
  if (tmpFolder)
    fs.rmdirSync(tmpFolder);
  process.exit(0);
}

if (cli.args.length !== 1) { // can not be the configFilePath
  cli.getUsage();
  process.exit(1);
}
const configFilePath = cli.args[0];

let resilioConfigFilePath;
if (cli.options.start || cli.options.watchmode) {
  tmpFolder = fs.mkdtempSync('/tmp/resilio-sync-watch-config-');
  resilioConfigFilePath = tmpFolder + '/sync.conf';
} else {
  resilioConfigFilePath = 'sync.conf';
}

parseConfigFile(configFilePath, resilioConfigFilePath);

if (cli.options.start || cli.options.watchmode) {
  startResilio(cli.options.resilioBin, resilioConfigFilePath, cli.options.watchmode);
  process.on('SIGINT', handleExitRequest);
  process.on('SIGTERM', handleExitRequest);
}

if (cli.options.watchmode) {
  console.log('watch', configFilePath);
  let lastChange = 0;
  fs.watch(configFilePath, () => {
    setTimeout(id => {
      if (id === lastChange) handleChange(configFilePath, resilioConfigFilePath);
    }, 100, ++lastChange);
  });
}
