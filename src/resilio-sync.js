const {spawn} = require('child_process')

module.exports = class Resilio {
  constructor(resilioBinary, resilioConfigFilePath) {
    this.resilioBinary = resilioBinary
    this.resilioConfigFilePath = resilioConfigFilePath
  }

  log(...args) {
    console.log(new Date(), 'Resilio', this.resilioConfigFilePath, ...args)
  }

  warn(...args) {
    console.warn(new Date(), 'Resilio', this.resilioConfigFilePath, ...args)
  }

  start(callbackOnClose, ...callbackArgs) {
    const syncArgs = ['--nodaemon', '--config', this.resilioConfigFilePath]

    this.log('start')

    this.running = true
    this.resilioProcess = spawn(this.resilioBinary, syncArgs, {
      stdio: 'ignore'
    })

    this.resilioProcess.on('close', code => {
      this.running = false
      if (code) {
        this.warn('crashed', code)
      } else {
        this.log('finished')
      }
      if (callbackOnClose) {
        callbackOnClose(code, ...callbackArgs)
      }
    })
  }

  stop() {
    if (!this.running) {
      return Promise.resolve()
    }

    const promise = new Promise((resolve, reject) => {
      this.resilioProcess.on('close', code => {
        if (code) {
          reject(code)
        } else {
          resolve()
        }
      })
    })
    this.resilioProcess.kill()
    return promise
  }
}
