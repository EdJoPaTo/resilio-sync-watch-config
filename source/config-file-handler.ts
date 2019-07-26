import {createConfigOnFS} from './filesystem/resilio-config'
import {loadFromFile} from './filesystem/own-config'
import {watchDebounced} from './filesystem/watch'

function log(...args: any[]): void {
  console.log(new Date(), 'Config File', ...args)
}

export default class ConfigFileHandler {
  constructor(
    private configFiles: string[],
    private resilioConfigFilePath: string
  ) {}

  async generateResilioConfig(createFoldersOnFS: boolean): Promise<void> {
    this._log('load configs…')
    const ownConfigs = await loadFromFile(...this.configFiles)
    this._log('generate config…')
    await createConfigOnFS(this.resilioConfigFilePath, createFoldersOnFS, ...ownConfigs)
    this._log('successfully generated config')
  }

  watch(onChangeCallback: () => void): void {
    this._log('start watching…')
    watchDebounced(onChangeCallback, ...this.configFiles)
  }

  private _log(...args: any[]): void {
    log(...args)
  }
}
