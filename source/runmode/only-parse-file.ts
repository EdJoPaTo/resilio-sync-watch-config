import * as resilio from 'resilio-sync'

import * as writeJsonFile from 'write-json-file'

import {parseConfigs} from '../config'

import {loadFromFile} from '../filesystem/own-config'

export async function onlyParseFile(inputConfigFilePaths: readonly string[], resilioConfigFilePath: string, generateFoldersOnFilesystem = true): Promise<void> {
  const ownConfigs = await loadFromFile(...inputConfigFilePaths)
  const resilioConfig = parseConfigs(...ownConfigs)

  if (generateFoldersOnFilesystem) {
    await resilio.generateFoldersOnFilesystem(resilioConfig)
  }

  await writeJsonFile(resilioConfigFilePath, resilioConfig)
}
