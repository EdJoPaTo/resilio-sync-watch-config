const {spawn} = require('child_process')

module.exports = class Resilio {
  constructor(resilioBinary, resilioConfigFilePath) {
    this.resilioBinary = resilioBinary
    this.resilioConfigFilePath = resilioConfigFilePath
  }

  start(callbackOnClose, ...callbackArgs) {
    const syncArgs = ['--nodaemon', '--config', this.resilioConfigFilePath]

    console.log('start', this.resilioBinary, 'with config', this.resilioConfigFilePath)

    this.running = true
    this.resilioProcess = spawn(this.resilioBinary, syncArgs, {
      stdio: 'ignore'
    })

    this.resilioProcess.on('close', code => {
      this.running = false
      if (code) {
        console.warn('Resilio Sync crashed.')
      } else {
        console.log('Resilio Sync finished.')
      }
      if (callbackOnClose) {
        callbackOnClose(code, ...callbackArgs)
      }
    })
  }

  stop() {
    if (!this.running) {
      return
    }

    this.resilioProcess.kill()
  }
}
