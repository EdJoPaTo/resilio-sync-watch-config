import writeJsonFile from 'write-json-file'

import {parseConfigs} from '../config'

import {createStoragePathOfConfig} from '../filesystem/resilio-config'
import {loadFromFile} from '../filesystem/own-config'

export async function onlyParseFile(inputConfigFilePaths: string[], resilioConfigFilePath: string, generateFoldersOnFilesystem = true): Promise<void> {
  const ownConfigs = await loadFromFile(...inputConfigFilePaths)
  const resilioConfig = parseConfigs(...ownConfigs)

  if (generateFoldersOnFilesystem) {
    createStoragePathOfConfig(resilioConfig)
  }

  await writeJsonFile(resilioConfigFilePath, resilioConfig)
}
