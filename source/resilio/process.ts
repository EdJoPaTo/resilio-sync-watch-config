import {spawn, ChildProcess} from 'child_process'

export class ResilioProcess {
  private _resilioProcess?: ChildProcess

  constructor(
    private readonly resilioBinary: string,
    private readonly resilioConfigFilePath: string
  ) {}

  start(callbackOnClose: (code: number, signal: string) => void): void {
    const syncArgs = ['--nodaemon', '--config', this.resilioConfigFilePath]

    this._resilioProcess = spawn(this.resilioBinary, syncArgs, {
      stdio: 'ignore'
    })

    this._resilioProcess.on('close', (code, signal) => {
      this._resilioProcess = undefined
      callbackOnClose(code, signal)
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
