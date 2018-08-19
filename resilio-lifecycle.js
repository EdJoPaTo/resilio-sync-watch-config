// This handles the livecycle of the resilio process.

const Resilio = require('./resilio-sync')

class ResilioLifecycle {
  constructor(resilioBinary, resilioConfigFilePath, finalCallback) {
    this.resilio = new Resilio(resilioBinary, resilioConfigFilePath)

    this.finalCallback = finalCallback
    this.resilioConfigFilePath = resilioConfigFilePath
  }

  start() {
    console.log('Start Resilio Sync…')
    this.running = true
    this.resilio.start(this.stoppedCallback)
    console.log('Started Resilio Sync successfully')
  }

  restart() {
    console.log('Restart Resilio Sync…')
    this.resilio.stop()
    setTimeout(() => {
      this.resilio.start(this.stoppedCallback)
      console.log('Restarted Resilio Sync successfully')
    }, 5000)
  }

  stop() {
    console.log('Stop Resilio Sync…')
    this.running = false
    this.resilio.stop()
    // console.log('Stopped Resilio Sync successfully')
  }

  stoppedCallback(code) {
    if (code || !this.running) {
      this.finalCallback(code)
    }
  }
}

module.exports = ResilioLifecycle
