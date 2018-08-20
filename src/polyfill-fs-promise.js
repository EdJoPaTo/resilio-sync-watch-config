const fs = require('fs')
const util = require('util')

const methods = [
  'mkdtemp',
  'readFile',
  'rmdir',
  'stat',
  'writeFile'
]

module.exports = {}
methods.forEach(o => {
  module.exports[o] = util.promisify(fs[o])
})
