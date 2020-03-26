import {ResilioConfig} from 'resilio-sync'

import {mergeMultipleConfigs} from './merge-multiple-configs'
import {OwnConfigPart} from './types'
import {parseConfig} from './parse-config'

export * from './types'

export function parseConfigs(...ownConfigs: OwnConfigPart[]): ResilioConfig {
  const ownConfig = mergeMultipleConfigs(...ownConfigs)
  return parseConfig(ownConfig)
}
