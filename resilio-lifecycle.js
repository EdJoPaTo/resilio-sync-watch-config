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
    this.resilio.start(code => this.stoppedCallback(code))
    console.log('Started Resilio Sync successfully')
  }

  restart() {
    console.log('Restart Resilio Sync…')
    this.restarting = true
    this.resilio.stop()
    setTimeout(() => {
      this.restarting = false
      this.resilio.start(code => this.stoppedCallback(code))
      console.log('Restarted Resilio Sync successfully')
    }, 5000)
  }

  stop() {
    console.log('Stop Resilio Sync…')
    this.running = false
    this.resilio.stop()
    // Currently wrong so its disabled
    // console.log('Stopped Resilio Sync successfully')
  }

  stoppedCallback(code) {
    if (this.running && !this.restarting) {
      if (code) {
        console.log(`Resilio crashed with code ${code}.`)
        if (!this.crashes) {
          this.crashes = 0
        }
        this.crashes++

        if (this.crashes < 3) {
          console.log(`Restart Resilio in 5 seconds… Attempt ${this.crashes}`)
          setTimeout(() => {
            this.resilio.start(code => this.stoppedCallback(code))
            console.log('Restarted Resilio Sync successfully')
          }, 5000)
        } else {
          throw new Error(`Resilio crashed ${this.crashes} times. Abort.`)
        }
      } else {
        throw new Error('Resilio ended without being told')
      }
    }

    if (code || !this.running) {
      this.finalCallback(code)
    }
  }
}

module.exports = ResilioLifecycle
