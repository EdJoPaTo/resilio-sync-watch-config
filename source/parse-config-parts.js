const os = require('os')

function ensureTrailingSlash(input) {
  if (input[input.length - 1] === '/') {
    return input
  }

  return input + '/'
}

function replaceWithHomedirIfNeeded(input) {
  if (input.substring(0, 2) === '~/') {
    const homedir = ensureTrailingSlash(os.homedir())
    return homedir + input.substring(2)
  }

  return input
}

function parseBasepath(input) {
  let current = ensureTrailingSlash(input)
  current = replaceWithHomedirIfNeeded(current)
  return current
}

module.exports = {
  ensureTrailingSlash,
  replaceWithHomedirIfNeeded,
  parseBasepath
}
