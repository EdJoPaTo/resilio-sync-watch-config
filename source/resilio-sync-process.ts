import {spawn, ChildProcess} from 'child_process'

export default class ResilioProcess {
  private _resilioProcess?: ChildProcess

  constructor(
    private resilioBinary: string,
    private resilioConfigFilePath: string
  ) {}

  log(...args: any[]): void {
    console.log(new Date(), 'Resilio', this.resilioConfigFilePath, ...args)
  }

  warn(...args: any[]): void {
    console.warn(new Date(), 'Resilio', this.resilioConfigFilePath, ...args)
  }

  start(callbackOnClose: (code: number, signal: string) => void): void {
    const syncArgs = ['--nodaemon', '--config', this.resilioConfigFilePath]

    this.log('start')

    this._resilioProcess = spawn(this.resilioBinary, syncArgs, {
      stdio: 'ignore'
    })

    this._resilioProcess.on('close', (code, signal) => {
      this._resilioProcess = undefined
      if (code) {
        this.warn('crashed', code, signal)
      } else {
        this.log('finished')
      }

      if (callbackOnClose) {
        callbackOnClose(code, signal)
      }
    })
  }

  async stop(): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      if (!this._resilioProcess) {
        return resolve()
      }

      this._resilioProcess.on('close', (code, signal) => {
        if (code) {
          reject(new Error(`Resilio terminated badly: ${code} ${signal}`))
        } else {
          resolve()
        }

        this._resilioProcess = undefined
      })
    })

    if (this._resilioProcess) {
      this._resilioProcess.kill()
    }

    return promise
  }
}

// TODO: remove when TypeScript migration is finished
module.exports = ResilioProcess
