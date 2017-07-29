#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs');

const parseConfig = require('./parseConfig.js');
const resilio = require('./resilio-sync.js');

function usage(err) {
  const usage = 'usage: resilio-sync-watch-config [options] config.json';
  const options = [
    '-s\tStart Resilio Sync after config generation',
    '-w\tWatch config. Restart Resilio Sync when changed. Implies -s'
  ];

  console.log(usage + '\n\noptions:\n' + options.join('\n'));
  process.exit(err ? 1 : 0);
}

function parseConfigFile(inputFilename, outputFilename) {
  try {
    console.log("generate config…");
    const contentString = fs.readFileSync(inputFilename, 'utf8');
    const content = JSON.parse(contentString);
    const resilioConfig = parseConfig(content);
    fs.writeFileSync(outputFilename, JSON.stringify(resilioConfig, null, '  '), 'utf8');
    child_process.execFileSync('mkdir', ['-p', resilioConfig.storage_path]);
  } catch (err) {
    console.error('generate config failed:', err);
  }
}

function startResilio(resilioConfigFilePath, watchmode) {
  const callback = watchmode ? resilioOnWatchmodeClose : null;
  resilio.start(resilioConfigFilePath, callback);
}

function resilioOnWatchmodeClose(code, resilioConfigFilePath) {
  setTimeout(resilioConfigFilePath => startResilio(resilioConfigFilePath, true), 5000, resilioConfigFilePath);
}

function handleChange(configFilePath, resilioConfigFilePath) {
  console.log('Stop Resilio Sync…');
  resilio.stop();
  parseConfigFile(configFilePath, resilioConfigFilePath);
}

let configFilePath;
let start;
let watchmode;

try {
  const args = process.argv.slice(2);
  const help = args.some(s => s === '-h' || s === '--help');

  configFilePath = args[args.length - 1];
  start = args.some(s => s === '-s' || s === '-w');
  watchmode = args.some(s => s === '-w');

  if (help || !configFilePath) {
    usage();
  }
} catch (err) {
  usage();
}

let resilioConfigFilePath;
if (start) {
  //TODO: cleanup tmpFolder on finish
  const tmpFolder = fs.mkdtempSync('/tmp/resilio-sync-watch-config-');
  resilioConfigFilePath = tmpFolder + '/sync.conf';
} else {
  resilioConfigFilePath = 'sync.conf';
}

parseConfigFile(configFilePath, resilioConfigFilePath);

if (start) {
  startResilio(resilioConfigFilePath, watchmode);
}

if (watchmode) {
  console.log('watch', configFilePath);
  let lastChange = 0;
  fs.watch(configFilePath, () => {
    setTimeout(id => {
      if (id === lastChange) handleChange(configFilePath, resilioConfigFilePath);
    }, 100, ++lastChange);
  });
}
