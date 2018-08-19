const test = require('ava')
const {ensureTrailingSlash, replaceWithHomedirIfNeeded} = require('./parse-config-parts')

test('ensureTrailingSlash with slash', t => {
  t.is(ensureTrailingSlash('test/'), 'test/')
})

test('ensureTrailingSlash without slash', t => {
  t.is(ensureTrailingSlash('test'), 'test/')
})

test('replaceWithHomedirIfNeeded not homedir', t => {
  t.is(replaceWithHomedirIfNeeded('test'), 'test')
})

test('replaceWithHomedirIfNeeded is homedir', t => {
  t.regex(replaceWithHomedirIfNeeded('~/test'), /.+\/.+\/test/)
})
