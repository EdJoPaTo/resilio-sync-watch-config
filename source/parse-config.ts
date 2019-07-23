import os from 'os'

import {parseBasepath} from './parse-config-parts'

export default function parseConfig(jsonConfig: any): any {
  const basedir = parseBasepath(jsonConfig.basedir)

  const resilioConfig: any = {}
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
