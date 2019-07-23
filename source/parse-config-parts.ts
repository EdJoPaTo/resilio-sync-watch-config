import os from 'os'

export function ensureTrailingSlash(input: string): string {
  if (input.endsWith('/')) {
    return input
  }

  return input + '/'
}

export function replaceWithHomedirIfNeeded(input: string): string {
  if (input.startsWith('~/')) {
    const homedir = ensureTrailingSlash(os.homedir())
    return homedir + input.substring(2)
  }

  return input
}

export function parseBasepath(input: string): string {
  let current = ensureTrailingSlash(input)
  current = replaceWithHomedirIfNeeded(current)
  return current
}
