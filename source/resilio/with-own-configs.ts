import {OwnConfigPart} from '../config'

import {createConfigOnFS} from '../filesystem/resilio-config'
import {createTempConfigFile} from '../filesystem/temp-config-file'
import {loadFromFile} from '../filesystem/own-config'

import {ResilioLifecycle} from './lifecycle'
import {ResilioProcess} from './process'

export class ResilioWithOwnConfigs {
  private readonly _configPath: string

  private readonly _lifecycle: ResilioLifecycle

  constructor(resilioBinary: string) {
    const tempConfig = createTempConfigFile()
    this._configPath = tempConfig.filepath
    this._lifecycle = new ResilioLifecycle(
      new ResilioProcess(resilioBinary, tempConfig.filepath),
      tempConfig.cleanupFunc
    )
  }

  async syncConfigs(...ownConfigs: readonly OwnConfigPart[]): Promise<void> {
    await createConfigOnFS(this._configPath, true, ...ownConfigs)
    await this._lifecycle.restart()
  }

  async syncConfigFiles(...ownConfigFiles: readonly string[]): Promise<void> {
    const ownConfigs = await loadFromFile(...ownConfigFiles)
    return this.syncConfigs(...ownConfigs)
  }

  async stop(): Promise<void> {
    await this._lifecycle.stop()
  }
}
