import * as fs from 'fs'

import test from 'ava'

import {generateConfig} from '../source/runmodes'

const {mkdtemp, rmdir, stat} = fs.promises

const BASEDIR = 'test-runmodes/'

const baseConfig = {
  folders: {
    something: 'XYZ'
  },
  passthrough: {
    device_name: 'just-test',
    upload_limit: 100
  }
}

test('sample config correctly parsed', async t => {
  const result: any = await generateConfig([
    baseConfig,
    {basedir: BASEDIR}
  ], false)

  t.deepEqual(result, {
    device_name: 'just-test',
    storage_path: `${BASEDIR}.sync`,
    upload_limit: 100,
    shared_folders: [{
      dir: `${BASEDIR}something`,
      secret: 'XYZ'
    }]
  })
})

test('storage_path folder is created', async t => {
  const tmpDir = await mkdtemp(BASEDIR)
  const result = await generateConfig([
    baseConfig,
    {basedir: tmpDir}
  ], true)
  t.is(result.storage_path, tmpDir + '/.sync')

  try {
    const storagePathStat = await stat(result.storage_path)
    t.log('bob', storagePathStat)
    t.true(storagePathStat.isDirectory())
  } catch (error) {
    t.log(error)
    t.fail('folder was not created: ' + result.storage_path)
  }

  try {
    await rmdir(result.storage_path)
  } catch (_) {}

  await rmdir(tmpDir)
})
