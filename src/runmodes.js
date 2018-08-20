const fs = require('fs')

const ConfigFileHandler = require('./config-file-handler')
const ResilioLifecycle = require('./resilio-lifecycle')

const fsPromises = fs.promises

async function createConfig(inputConfigFilePaths, resilioConfigFilePath, generateFoldersOnFilesystem = false, saveConfigOnFilesystem = true) {
  const configFileHandler = new ConfigFileHandler(inputConfigFilePaths, resilioConfigFilePath)
  const config = await configFileHandler.generateResilioConfig(generateFoldersOnFilesystem, saveConfigOnFilesystem)
  return config
}

async function startResilioFromConfigs(inputConfigFilePaths, watchInputConfigFiles = false, resilioBinary = 'rslsync') {
  const tmpFolder = await fsPromises.mkdtemp('/tmp/resilio-sync-watch-config-')
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
    fs.unlinkSync(tmpFolder + '/sync.conf')
  } catch (err) {}

  try {
    fs.rmdirSync(tmpFolder)
  } catch (err) {}
}

module.exports = {
  createConfig,
  startResilioFromConfigs
}
