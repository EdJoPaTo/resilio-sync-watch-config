const spawn = require('child_process').spawn;

let resilioProcess;

function start(resilioConfigFilePath, callbackOnClose) {
  const rslsync = 'rslsync';
  const syncArgs = ['--nodaemon', '--config', resilioConfigFilePath];

  console.log('start', rslsync, 'with config', resilioConfigFilePath);
  resilioProcess = spawn(rslsync, syncArgs, {
    stdio: 'ignore'
  });
  if (callbackOnClose) {
    resilioProcess.on('close', code => callbackOnClose(code, resilioConfigFilePath));
  }
}

function kill() {
  resilioProcess.kill();
}

module.exports = {
  start: start,
  stop: kill
};