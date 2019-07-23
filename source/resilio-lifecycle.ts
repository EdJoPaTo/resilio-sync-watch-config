import ResilioProcess from './resilio-sync-process'

// This handles the livecycle of the resilio process.
export default class ResilioLifecycle {
  private readonly _resilio: ResilioProcess

  private _running = false

  private _restarting = false

  private _crashes = 0

  constructor(
    // TODO: directly accept ResilioProcess
    resilioBinary: string, resilioConfigFilePath: string,
    private finalCallback: (code: number, signal: string) => void
  ) {
    this._resilio = new ResilioProcess(resilioBinary, resilioConfigFilePath)
  }

  start(): void {
    this._log('Start Resilio Sync…')
    this._running = true
    this._resilio.start((code, signal) => this._stoppedCallback(code, signal))
    this._log('Started Resilio Sync successfully')
  }

  async restart(): Promise<void> {
    this._log('Restart Resilio Sync…')
    this._restarting = true
    await this._resilio.stop()
    this._restarting = false
    this._resilio.start((code, signal) => this._stoppedCallback(code, signal))
    this._log('Restarted Resilio Sync successfully')
  }

  async stop(): Promise<void> {
    this._log('Stop Resilio Sync…')
    this._running = false
    await this._resilio.stop()
    this._log('Stopped Resilio Sync successfully')
  }

  private _stoppedCallback(code: number, signal: string): void {
    if (this._running && !this._restarting) {
      if (code) {
        this._warn(`Resilio crashed with code ${code} ${signal}.`)

        this._crashes++

        if (this._crashes < 3) {
          this._log(`Restart Resilio in 5 seconds… Attempt ${this._crashes}`)
          setTimeout(() => {
            this._resilio.start((code, signal) => this._stoppedCallback(code, signal))
            this._log('Restarted Resilio Sync successfully')
          }, 5000)
        } else {
          throw new Error(`Resilio crashed ${this._crashes} times. Abort.`)
        }
      } else {
        throw new Error('Resilio ended without being told')
      }
    }

    if (code || !this._running) {
      this.finalCallback(code, signal)
    }
  }

  private _log(...args: any[]): void {
    console.log(new Date(), 'Lifecycle', ...args)
  }

  private _warn(...args: any[]): void {
    console.warn(new Date(), 'Lifecycle', ...args)
  }
}

// TODO: remove when TypeScript migration is finished
module.exports = ResilioLifecycle
