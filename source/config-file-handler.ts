import * as fs from 'fs'

import {ResilioConfig, OwnConfigPart, parseConfigs} from './config'

import {createStoragePathOfConfig} from './filesystem/resilio-config'
import {watchDebounced} from './filesystem/watch'

const {readFile, writeFile} = fs.promises

function log(...args: any[]): void {
  console.log(new Date(), 'Config File', ...args)
}

async function loadFromFile(filepath: string): Promise<OwnConfigPart> {
  const content = await readFile(filepath, 'utf8')
  return JSON.parse(content)
}

async function saveToFile(filepath: string, json: any): Promise<void> {
  const content = JSON.stringify(json, null, 2)
  return writeFile(filepath, content, 'utf8')
}

export default class ConfigFileHandler {
  constructor(
    private configFiles: string[],
    private resilioConfigFilePath: string
  ) {}

  async generateResilioConfig(createFoldersOnFS = true, saveToFS = false): Promise<ResilioConfig> {
    this._log('load configs…')
    const configs = await Promise.all(
      this.configFiles.map(
        async file => loadFromFile(file)
      )
    )
    log('generate config…')
    const resilioConfig = parseConfigs(...configs)

    if (createFoldersOnFS) {
      this._log('create folders in filesystem…', resilioConfig.storage_path)
      await createStoragePathOfConfig(resilioConfig)
    }

    if (saveToFS) {
      this._log('save resilio config…', this.resilioConfigFilePath)
      await saveToFile(this.resilioConfigFilePath, resilioConfig)
    }

    this._log('successfully generated config')
    return resilioConfig
  }

  watch(onChangeCallback: () => void): void {
    this._log('start watching…')
    watchDebounced(onChangeCallback, ...this.configFiles)
  }

  private _log(...args: any[]): void {
    log(...args)
  }
}
