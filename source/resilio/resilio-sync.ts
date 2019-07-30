import writeJsonFile from 'write-json-file'

import {ResilioConfig} from '../config'

import {createTempConfigFile} from '../filesystem/temp-config-file'
import {createStoragePathOfConfig} from '../filesystem/resilio-config'

import {ResilioSyncProcess} from './process'

type CloseCallback = (code: number, signal: string) => void

/**
 * Class to handle a resilio process to sync
 */
export class ResilioSync {
  private _process?: ResilioSyncProcess

  constructor(
    private readonly resilioBinary: string = 'rslsync'
  ) {}

  /**
   * Starts syncing with the provided configFile. Stops previously running sync process.
   */
  async syncConfigFile(configFilePath: string, callbackOnClose: CloseCallback = () => {}): Promise<void> {
    await this.stop()

    this._process = new ResilioSyncProcess(this.resilioBinary, configFilePath)
    this._process.start(callbackOnClose)
  }

  /**
   * Starts syncing with the provided config. Stops previously running sync process.
   */
  async syncConfig(config: ResilioConfig, callbackOnClose: CloseCallback = () => {}): Promise<void> {
    const temp = createTempConfigFile()

    try {
      await writeJsonFile(temp.filepath, config)
      await createStoragePathOfConfig(config)

      await this.syncConfigFile(temp.filepath, (code: number, signal: string) => {
        temp.cleanupFunc()
        callbackOnClose(code, signal)
      })
    } catch (error) {
      temp.cleanupFunc()
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this._process) {
      await this._process.stop()
      delete this._process
    }
  }
}
