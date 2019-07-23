const fs = require('fs')

const ConfigFileHandler = require('./config-file-handler')
const ResilioLifecycle = require('./resilio-lifecycle')

const {unlinkSync, rmdirSync} = fs
const {mkdtemp} = fs.promises

function createConfigFile(inputConfigFilePaths, resilioConfigFilePath, generateFoldersOnFilesystem = true) {
  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  return configFileHandler.generateResilioConfig(generateFoldersOnFilesystem, true)
}

async function generateConfig(inputConfigs, generateFoldersOnFilesystem = false) {
  const config = ConfigFileHandler.parseMultipleConfigs(inputConfigs)
  if (generateFoldersOnFilesystem) {
    await ConfigFileHandler.createFoldersOfConfig(config)
  }

  return config
}

async function startResilioFromConfigs(inputConfigFilePaths, watchInputConfigFiles = false, resilioBinary = 'rslsync') {
  const tmpFolder = await mkdtemp('/tmp/resilio-sync-watch-config-')
  const resilioConfigFilePath = tmpFolder + '/sync.conf'

  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  const resilio = new ResilioLifecycle(resilioBinary, resilioConfigFilePath, () => cleanup(tmpFolder))

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

function cleanup(tmpFolder) {
  try {
    unlinkSync(tmpFolder + '/sync.conf')
  } catch (_) {}

  try {
    rmdirSync(tmpFolder)
  } catch (_) {}
}

module.exports = {
  createConfigFile,
  generateConfig,
  startResilioFromConfigs
}
