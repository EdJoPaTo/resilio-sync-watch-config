import * as fs from 'fs'
import * as path from 'path'

import {ResilioWithOwnConfigs} from '../resilio'

import {OwnConfig, OwnConfigPart} from '../config'

import {loadFromFile} from '../filesystem/own-config'
import {parseBasepath} from '../filesystem/path'
import {watchDebounced} from '../filesystem/watch'

const {readdir, mkdir} = fs.promises

export async function runWithShareKey(resilio: ResilioWithOwnConfigs, basedir: string, shareKey: string): Promise<void> {
  const initConfig: OwnConfig = {
    basedir,
    folders: {
      '.config': shareKey
    }
  }

  const absoluteBasepath = parseBasepath(basedir)
  const configFolder = absoluteBasepath + '.config'
  await mkdir(configFolder, {recursive: true})

  const availableConfigsOnStartup = await loadConfigs(configFolder)
  await resilio.syncConfigs(...availableConfigsOnStartup, initConfig)

  watchDebounced(
    async () => {
      try {
        const ownConfigParts = await loadConfigs(configFolder)
        await resilio.syncConfigs(...ownConfigParts, initConfig)
      } catch (error) {
        console.error(new Date(), 'run with share key', 'error while restarting', error)
      }
    },
    configFolder
  )
}

async function loadConfigs(configFolder: string): Promise<readonly OwnConfigPart[]> {
  const content = await readdir(configFolder, {withFileTypes: true})
  const configFiles = content
    .filter(o => o.isFile())
    .filter(o => o.name.endsWith('.json'))
    .map(o => o.name)

  console.log(new Date(), 'run with share key', 'found config files', configFiles)

  const fullpathConfigFiles = configFiles.map(o => path.join(configFolder, o))
  return loadFromFile(...fullpathConfigFiles)
}
