import * as fs from 'fs'
import * as path from 'path'

import {ResilioWithOwnConfigs} from '../resilio'

import {OwnConfig, parseConfigs} from '../config'

import {loadFromFile} from '../filesystem/own-config'
import {watchDebounced} from '../filesystem/watch'

const {readdir, mkdir} = fs.promises

export async function runWithShareKey(resilio: ResilioWithOwnConfigs, basedir: string, shareKey: string): Promise<void> {
  const initConfig: OwnConfig = {
    basedir,
    folders: {
      '.config': shareKey
    }
  }

  const actualBasepath = parseConfigs(initConfig).shared_folders
    .filter(o => o.dir.endsWith('/.config'))
    .map(o => o.dir)[0]
  await mkdir(actualBasepath, {recursive: true})

  await resilio.syncConfigs(initConfig)

  watchDebounced(
    async () => {
      try {
        const content = await readdir(actualBasepath, {withFileTypes: true})
        const configFiles = content
          .filter(o => o.isFile())
          .filter(o => o.name.endsWith('.json'))
          .map(o => o.name)

        console.log(new Date(), 'run with share key', 'found config files', configFiles)

        const ownConfigParts = await loadFromFile(...configFiles.map(o => path.join(actualBasepath, o)))
        await resilio.syncConfigs(...ownConfigParts, initConfig)
      } catch (error) {
        console.error(new Date(), 'run with share key', 'error while restarting', error)
      }
    },
    actualBasepath
  )
}
