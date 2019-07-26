import {createConfigOnFS} from '../filesystem/resilio-config'
import {loadFromFile} from '../filesystem/own-config'

export async function onlyParseFile(inputConfigFilePaths: string[], resilioConfigFilePath: string, generateFoldersOnFilesystem = true): Promise<void> {
  const ownConfigs = await loadFromFile(...inputConfigFilePaths)
  await createConfigOnFS(resilioConfigFilePath, generateFoldersOnFilesystem, ...ownConfigs)
}
