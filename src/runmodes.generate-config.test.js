const fs = require('fs')

const test = require('ava')
const {generateConfig} = require('./runmodes')

const fsPromises = fs.promises

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
  const result = await generateConfig([
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
  const tmpDir = await fsPromises.mkdtemp(BASEDIR)
  const result = await generateConfig([
    baseConfig,
    {basedir: tmpDir}
  ], true)
  t.is(result.storage_path, tmpDir + '/.sync')

  try {
    const stat = await fsPromises.stat(result.storage_path)
    t.true(stat.isDirectory())
  } catch (err) {
    t.fail('folder was not created: ' + result.storage_path)
  }

  try {
    await fsPromises.rmdir(result.storage_path)
  } catch (err) {}
  await fsPromises.rmdir(tmpDir)
})
