import {hostname} from 'os'

import {ResilioConfig, ResilioConfigFolder} from 'resilio-sync'

import {parseBasepath} from '../filesystem/path'

import {OwnConfig, OwnConfigFolders} from './types'

export function parseConfig(jsonConfig: OwnConfig): ResilioConfig {
  const basedir = parseBasepath(jsonConfig.basedir)

  const resilioConfig: ResilioConfig = {
    device_name: hostname(),
    storage_path: basedir + '.sync',
    shared_folders: parseFolders(basedir, jsonConfig.folders)
  }

  if (jsonConfig.passthrough) {
    Object.assign(resilioConfig, jsonConfig.passthrough)
  }

  return resilioConfig
}

function parseFolders(basedir: string, folders: OwnConfigFolders): ResilioConfigFolder[] {
  const foldernames = Object.keys(folders)
  return foldernames.map(name => parseFolder(basedir, name, folders[name]))
}

function parseFolder(basedir: string, name: string, secret: string): ResilioConfigFolder {
  return {
    dir: basedir + name,
    secret
  }
}
