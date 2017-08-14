const spawn = require('child_process').spawn

let resilioProcess

function start(resilioBinary, resilioConfigFilePath, callbackOnClose) {
  const syncArgs = ['--nodaemon', '--config', resilioConfigFilePath]

  console.log('start', resilioBinary, 'with config', resilioConfigFilePath)
  resilioProcess = spawn(resilioBinary, syncArgs, {
    stdio: 'ignore'
  })
  if (callbackOnClose) {
    resilioProcess.on('close', code => {
      if (code) {
        console.warn('Resilio Sync crashed.')
      } else {
        console.log('Resilio Sync finished.')
      }
      callbackOnClose(code, resilioConfigFilePath)
    })
  }
}

function kill() {
  resilioProcess.kill()
}

module.exports = {
  start: start,
  stop: kill
}
