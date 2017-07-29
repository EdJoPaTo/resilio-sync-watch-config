#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs');
const parseConfig = require('./parseConfig.js');

//TODO: cleanup tmpFolder on finish
const tmpFolder = fs.mkdtempSync('/tmp/resilio-sync-watch-config-');
const RESILIO_CONFIG = tmpFolder + '/sync.conf';
let resilioProcess;

function usage(err) {
  const usage = 'usage: resilio-sync-watch-config [options] config.json';
  const options = [
    '-s\tStart Resilio Sync after config generation',
    '-w\tWatch config. Restart Resilio Sync when changed. Implies -s'
  ];

  console.log(usage + '\n\noptions:\n' + options.join('\n'));
  process.exit(err ? 1 : 0);
}

function parseConfigFile(filename) {
  try {
    console.log("generate config…");
    const contentString = fs.readFileSync(filename, 'utf8');
    const content = JSON.parse(contentString);
    const resilioConfig = parseConfig(content);
    fs.writeFileSync(RESILIO_CONFIG, JSON.stringify(resilioConfig, null, '  '), 'utf8');
    child_process.execFileSync('mkdir', ['-p', resilioConfig.storage_path]);
  } catch (err) {
    console.error('generate config failed:', err);
  }
}

let first = true;

function startSync(watchmodeEnabled) {
  const rslsync = 'rslsync';
  const syncArgs = ['--nodaemon', '--config', RESILIO_CONFIG];
  const pipeOutputToNowhere = ">/dev/zero 2>/dev/zero";

  console.log('start', rslsync, syncArgs);
  resilioProcess = child_process.spawn(rslsync, syncArgs, {
    stdio: 'ignore'
  });
  resilioProcess.on('close', (code) => {
    console.log('Resilio Sync ended.', code);
    if (watchmodeEnabled) {
      setTimeout(startSync, 5000, watchmodeEnabled);
    }
  });
}

function handleChange(configFilePath) {
  console.log('Stop Resilio Sync…');
  resilioProcess.kill();
  parseConfigFile(configFilePath);
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

parseConfigFile(configFilePath);

if (start) {
  startSync(watchmode);
}

if (watchmode) {
  console.log('watch', configFilePath);
  let lastChange = 0;
  fs.watch(configFilePath, () => {
    setTimeout(id => {
      if (id === lastChange) handleChange(configFilePath);
    }, 100, ++lastChange);
  });
}
