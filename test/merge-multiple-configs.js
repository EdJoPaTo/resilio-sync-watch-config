import test from 'ava'

import {mergeMultipleConfigs} from '../src/merge-multiple-configs'

const config1 = {
  basedir: '/location/',
  folders: {
    folder1: 'XYZ'
  },
  passthrough: {
    something: 42
  }
}

const config2 = {
  basedir: '/location/',
  folders: {
    folder2: 'ABC'
  },
  passthrough: {
    else: '1337'
  }
}

test('does not change the input objects', t => {
  const input1 = {test: 1}
  const input2 = {test: 2}
  const input3 = {basedir: 'foobar'}
  const input4 = {folders: {stuff: 'X'}}
  mergeMultipleConfigs(input1, input2, input3, input4)
  t.deepEqual(input1, {test: 1})
  t.deepEqual(input2, {test: 2})
  t.deepEqual(input3, {basedir: 'foobar'})
  t.deepEqual(input4, {folders: {stuff: 'X'}})
})

test('one is one', t => {
  t.deepEqual(mergeMultipleConfigs(config1), config1)
})

test('all folders still there', t => {
  const result = mergeMultipleConfigs(config1, config2)
  t.deepEqual(result.folders, {
    folder1: 'XYZ',
    folder2: 'ABC'
  })
})

test('all passthroughs still there', t => {
  const result = mergeMultipleConfigs(config1, config2)
  t.deepEqual(result.passthrough, {
    something: 42,
    else: '1337'
  })
})

test('last config folder overrides', t => {
  const result = mergeMultipleConfigs(config1, {
    folders: {
      folder1: 'ZZZ'
    }
  })

  t.deepEqual(result.folders, {
    folder1: 'ZZZ'
  })
})

test('error when basedir differs', t => {
  const config = {
    basedir: 'somewhere/over/the/rainbow'
  }

  t.throws(() => mergeMultipleConfigs(config1, config), /basedir/)
})

test('error when no basedir', t => {
  const config = {}

  t.throws(() => mergeMultipleConfigs(config), /basedir/)
})

test('error when folders object missing', t => {
  const config = {
    basedir: '42'
  }
  t.throws(() => mergeMultipleConfigs(config), /folders/)
})
