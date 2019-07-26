import * as fs from 'fs'

import {ResilioLifecycle, ResilioProcess} from '../resilio'
import ConfigFileHandler from '../config-file-handler'

const {unlinkSync, rmdirSync} = fs
const {mkdtemp} = fs.promises

export async function runWithSpecificFiles(inputConfigFilePaths: string[], watchInputConfigFiles = false, resilioBinary: string): Promise<ResilioLifecycle> {
  const tmpFolder = await mkdtemp('/tmp/resilio-sync-watch-config-')
  const resilioConfigFilePath = tmpFolder + '/sync.conf'

  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  const resilio = new ResilioLifecycle(
    new ResilioProcess(resilioBinary, resilioConfigFilePath),
    () => cleanup(tmpFolder)
  )

  await configFileHandler.generateResilioConfig(true)
  resilio.start()

  if (watchInputConfigFiles) {
    configFileHandler.watch(async () => {
      await configFileHandler.generateResilioConfig(true)
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
