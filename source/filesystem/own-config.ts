import * as fs from 'fs'

import {OwnConfig} from '../config'

const {readdir, readFile, rmdir} = fs.promises

async function readJsonFile(filepath: string): Promise<Partial<OwnConfig>> {
  const content = await readFile(filepath, 'utf8')
  return JSON.parse(content) as Partial<OwnConfig>
}

export async function loadFromFile(...filepaths: readonly string[]): Promise<ReadonlyArray<Partial<OwnConfig>>> {
  return Promise.all(
    filepaths.map(
      async file => readJsonFile(file)
    )
  )
}

export async function removeSuperfluousFolders(absoluteBasepath: string, config: OwnConfig): Promise<readonly string[]> {
  const expected = [
    '.sync',
    ...Object.keys(config.folders)
  ]

  const actual = await readdir(absoluteBasepath)
  const superfluous = actual.filter(o => !expected.includes(o))

  await Promise.all(
    superfluous.map(async o => rmdir(absoluteBasepath + o, {recursive: true}))
  )

  return superfluous
}
