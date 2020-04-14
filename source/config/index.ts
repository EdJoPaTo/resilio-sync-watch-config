import {ResilioConfig} from 'resilio-sync'

import {mergeMultipleConfigs} from './merge-multiple-configs'
import {OwnConfig} from './types'
import {parseConfig} from './parse-config'

export * from './types'

export function parseConfigs(...ownConfigs: ReadonlyArray<Partial<OwnConfig>>): ResilioConfig {
  const ownConfig = mergeMultipleConfigs(...ownConfigs)
  return parseConfig(ownConfig)
}
