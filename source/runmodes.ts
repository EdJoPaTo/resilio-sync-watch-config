import * as fs from 'fs'

import {ResilioConfig} from './config'

import ConfigFileHandler from './config-file-handler'
import ResilioLifecycle from './resilio-lifecycle'
import ResilioProcess from './resilio-sync-process'

const {unlinkSync, rmdirSync} = fs
const {mkdtemp} = fs.promises

export async function createConfigFile(inputConfigFilePaths: string[], resilioConfigFilePath: string, generateFoldersOnFilesystem = true): Promise<ResilioConfig> {
  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  return configFileHandler.generateResilioConfig(generateFoldersOnFilesystem, true)
}

export async function startResilioFromConfigs(inputConfigFilePaths: string[], watchInputConfigFiles = false, resilioBinary = 'rslsync'): Promise<ResilioLifecycle> {
  const tmpFolder = await mkdtemp('/tmp/resilio-sync-watch-config-')
  const resilioConfigFilePath = tmpFolder + '/sync.conf'

  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  const resilio = new ResilioLifecycle(
    new ResilioProcess(resilioBinary, resilioConfigFilePath),
    () => cleanup(tmpFolder)
  )

  await configFileHandler.generateResilioConfig(true, true)
  resilio.start()

  if (watchInputConfigFiles) {
    configFileHandler.watch(async () => {
      await configFileHandler.generateResilioConfig(true, true)
      await resilio.restart()
    })
  }

  return resilio
}

function cleanup(tmpFolder: string): void {
  try {
    unlinkSync(tmpFolder + '/sync.conf')
  } catch (_) {}

  try {
    rmdirSync(tmpFolder)
  } catch (_) {}
}
