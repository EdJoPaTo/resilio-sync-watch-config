import * as fs from 'fs'

import {ResilioConfig} from '../config'

const {mkdir} = fs.promises

export async function createStoragePathOfConfig(resilioConfig: ResilioConfig): Promise<void> {
  return mkdir(resilioConfig.storage_path, {recursive: true})
}
