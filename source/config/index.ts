import {ResilioConfig} from 'resilio-sync'

import {OwnConfigPart} from './types'
import mergeMultipleConfigs from './merge-multiple-configs'
import parseConfig from './parse-config'

export * from './types'

export function parseConfigs(...ownConfigs: OwnConfigPart[]): ResilioConfig {
  const ownConfig = mergeMultipleConfigs(...ownConfigs)
  return parseConfig(ownConfig)
}
