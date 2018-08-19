const os = require('os')
const {parseBasepath} = require('./parse-config-parts')

function parseConfig(jsonConfig) {
  const basedir = parseBasepath(jsonConfig.basedir)

  const resilioConfig = {}
  resilioConfig.device_name = os.hostname()
  resilioConfig.storage_path = basedir + '.sync'

  const foldernames = Object.keys(jsonConfig.folders)
  resilioConfig.shared_folders = foldernames.map(name => ({
    dir: basedir + name,
    secret: jsonConfig.folders[name]
  }))

  if (jsonConfig.passthrough) {
    Object.assign(resilioConfig, jsonConfig.passthrough)
  }

  return resilioConfig
}

module.exports = parseConfig
