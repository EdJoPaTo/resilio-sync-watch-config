// This handles the livecycle of the resilio process.

const Resilio = require('./resilio-sync')

class ResilioLifecycle {
  constructor(resilioBinary, resilioConfigFilePath, finalCallback) {
    this.resilio = new Resilio(resilioBinary, resilioConfigFilePath)

    this.finalCallback = finalCallback
    this.resilioConfigFilePath = resilioConfigFilePath
  }

  log(...args) {
    console.log(new Date(), 'Lifecycle', ...args)
  }

  warn(...args) {
    console.warn(new Date(), 'Lifecycle', ...args)
  }

  start() {
    this.log('Start Resilio Sync…')
    this.running = true
    this.resilio.start(code => this.stoppedCallback(code))
    this.log('Started Resilio Sync successfully')
  }

  async restart() {
    this.log('Restart Resilio Sync…')
    this.restarting = true
    await this.resilio.stop()
    this.restarting = false
    this.resilio.start(code => this.stoppedCallback(code))
    this.log('Restarted Resilio Sync successfully')
  }

  async stop() {
    this.log('Stop Resilio Sync…')
    this.running = false
    await this.resilio.stop()
    this.log('Stopped Resilio Sync successfully')
  }

  stoppedCallback(code) {
    if (this.running && !this.restarting) {
      if (code) {
        this.warn(`Resilio crashed with code ${code}.`)
        if (!this.crashes) {
          this.crashes = 0
        }

        this.crashes++

        if (this.crashes < 3) {
          this.log(`Restart Resilio in 5 seconds… Attempt ${this.crashes}`)
          setTimeout(() => {
            this.resilio.start(code => this.stoppedCallback(code))
            this.log('Restarted Resilio Sync successfully')
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
