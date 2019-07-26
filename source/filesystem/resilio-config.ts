import * as fs from 'fs'

import {ResilioConfig, OwnConfigPart, parseConfigs} from '../config'

const {mkdir, writeFile} = fs.promises

async function saveToFile(filepath: string, json: any): Promise<void> {
  const content = JSON.stringify(json, null, 2) + '\n'
  return writeFile(filepath, content, 'utf8')
}

export async function createStoragePathOfConfig(resilioConfig: ResilioConfig): Promise<void> {
  return mkdir(resilioConfig.storage_path, {recursive: true})
}

export async function createConfigOnFS(resilioConfigFilePath: string, createFoldersOnFS: boolean, ...ownConfigs: readonly OwnConfigPart[]): Promise<ResilioConfig> {
  const resilioConfig = parseConfigs(...ownConfigs)

  if (createFoldersOnFS) {
    // Try to create before saving config -> saved config will always work
    createStoragePathOfConfig(resilioConfig)
  }

  await saveToFile(resilioConfigFilePath, resilioConfig)
  return resilioConfig
}
