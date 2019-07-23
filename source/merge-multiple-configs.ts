import arrayFilterUnique from 'array-filter-unique'

import {OwnConfig} from './types'

// https://stackoverflow.com/a/34749873
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

function mergeDeep(target: any, ...sources: any[]): any {
  if (sources.length === 0) {
    return target
  }

  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, {
            [key]: {}
          })
        }

        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, {
          [key]: source[key]
        })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

export function mergeMultipleConfigs(...configs: OwnConfig[]): OwnConfig {
  const result = mergeDeep({}, ...configs)

  const differingBasedirs = configs
    .map(o => o.basedir)
    .filter(o => o)
    .filter(arrayFilterUnique())

  if (differingBasedirs.length === 0) {
    throw new Error('There is no basedir defined.')
  }

  if (differingBasedirs.length > 1) {
    throw new Error('There is more than one basedir defined. This is dangerous and therefore that allowed.')
  }

  if (!result.folders || result.folders === 0) {
    throw new Error('There are no folders defined. Sync will be useless.')
  }

  return result
}

module.exports = {
  mergeMultipleConfigs
}
