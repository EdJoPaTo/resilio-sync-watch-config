import test from 'ava'

import {parseConfig} from '../../source/config/parse-config'

const inputBasicConfig = {
  basedir: '/location/',
  folders: {}
}

test('creates minimal config', t => {
  const out = parseConfig(inputBasicConfig)
  t.truthy(out.device_name)
  t.truthy(out.storage_path)
  t.truthy(out.shared_folders)
})

test('creates storage_path', t => {
  const out = parseConfig(inputBasicConfig)
  t.is(out.storage_path, '/location/.sync')
})

test('has a device_name', t => {
  const out = parseConfig(inputBasicConfig)
  t.regex(out.device_name, /.+/)
})

test('has 0 shared folders', t => {
  const out = parseConfig(inputBasicConfig)
  t.deepEqual(out.shared_folders, [])
})

test('basedir without ending slash', t => {
  const input = {
    basedir: '/location',
    folders: {}
  }
  const out = parseConfig(input)
  t.is(out.storage_path, '/location/.sync')
})

test('basedir can be relative to pwd', t => {
  const input = {
    basedir: 'location',
    folders: {}
  }
  const out = parseConfig(input)
  t.is(out.storage_path, 'location/.sync')
})

test('basedir can be relative to home', t => {
  const input = {
    basedir: '~/location/',
    folders: {}
  }
  const out = parseConfig(input)
  const regex = /\/\S+\/\S+\/location\/\.sync/
  t.regex(out.storage_path, regex)
})

const inputPassthrough = {...inputBasicConfig, passthrough: {
  device_name: 'sparta',
  what_the: 'hell'
}}

test('adds passthrough', t => {
  const out: any = parseConfig(inputPassthrough)
  t.is(out.what_the, 'hell')
})

test('overrides device_name', t => {
  const out = parseConfig(inputPassthrough)
  t.is(out.device_name, 'sparta')
})

test('contains the shared folder', t => {
  const input = {...inputBasicConfig, folders: {
    tmp: 'XYZ'
  }}

  const out = parseConfig(input)
  t.deepEqual(out.shared_folders, [
    {
      dir: '/location/tmp',
      secret: 'XYZ'
    }
  ])
})
