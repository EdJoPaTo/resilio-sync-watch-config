import * as fs from 'fs'

import {OwnConfigPart} from '../config'

const {readFile} = fs.promises

async function readJsonFile(filepath: string): Promise<OwnConfigPart> {
  const content = await readFile(filepath, 'utf8')
  return JSON.parse(content)
}

export async function loadFromFile(...filepaths: readonly string[]): Promise<readonly OwnConfigPart[]> {
  return Promise.all(
    filepaths.map(
      async file => readJsonFile(file)
    )
  )
}
