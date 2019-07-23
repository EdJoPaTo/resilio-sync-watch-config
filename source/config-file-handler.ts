import * as fs from 'fs'

import debounce from 'debounce-promise'

import {ResilioConfig, OwnConfig} from './types'

import parseConfig from './parse-config'
import {mergeMultipleConfigs} from './merge-multiple-configs'

const {readFile, writeFile, mkdir} = fs.promises

function log(...args: any[]): void {
  console.log(new Date(), 'Config File', ...args)
}

async function loadFromFile(filepath: string): Promise<OwnConfig> {
  const content = await readFile(filepath, 'utf8')
  return JSON.parse(content)
}

async function saveToFile(filepath: string, json: any): Promise<void> {
  const content = JSON.stringify(json, null, 2)
  return writeFile(filepath, content, 'utf8')
}

function watchFile(file: string, onChangeCallback: (file: string, curr: any) => void): void {
  fs.watch(file, {persistent: false}, debounce((curr: any) => {
    // TODO: type curr, see https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
    log(file, 'changed', curr)
    onChangeCallback(file, curr)
  }, 500))
}

export default class ConfigFileHandler {
  constructor(
    private configFiles: string[],
    private resilioConfigFilePath: string
  ) {}

  static parseMultipleConfigs(configs: OwnConfig[]): ResilioConfig {
    const mergedConfig = mergeMultipleConfigs(...configs)
    return parseConfig(mergedConfig)
  }

  static async createFoldersOfConfig(resilioConfig: ResilioConfig): Promise<void> {
    return mkdir(resilioConfig.storage_path, {recursive: true})
  }

  async generateResilioConfig(createFoldersOnFS = true, saveToFS = false): Promise<ResilioConfig> {
    this._log('load configs…')
    const configs = await Promise.all(
      this.configFiles.map(
        async file => loadFromFile(file)
      )
    )
    log('generate config…')
    const resilioConfig = ConfigFileHandler.parseMultipleConfigs(configs)

    if (createFoldersOnFS) {
      this._log('create folders in filesystem…', resilioConfig.storage_path)
      await ConfigFileHandler.createFoldersOfConfig(resilioConfig)
    }

    if (saveToFS) {
      this._log('save resilio config…', this.resilioConfigFilePath)
      await saveToFile(this.resilioConfigFilePath, resilioConfig)
    }

    this._log('successfully generated config')
    return resilioConfig
  }

  watch(onChangeCallback: (file: string, curr: any) => void): void {
    this._log('start watching…')
    this.configFiles.forEach(file => watchFile(file, onChangeCallback))
  }

  private _log(...args: any[]): void {
    log(...args)
  }
}

// TODO: remove when TypeScript migration is finished
module.exports = ConfigFileHandler
