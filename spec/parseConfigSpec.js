const parseConfig = require('../parseConfig.js')

describe('Config Parser', () => {
  it('creates minimal config', () => {
    const input = {
      basedir: '/location/',
      folders: {}
    }
    const out = parseConfig(input)
    expect(out).toBeDefined()
    expect(out.device_name).toBeDefined()
    expect(out.storage_path).toBeDefined()
    expect(out.shared_folders).toBeDefined()
  })

  it('creates storage_path', () => {
    const input = {
      basedir: '/location/',
      folders: {}
    }
    const out = parseConfig(input)
    expect(out.storage_path).toBe('/location/.sync')
  })

  it('allowes basepath without ending slash', () => {
    const input = {
      basedir: '/location',
      folders: {}
    }
    const out = parseConfig(input)
    expect(out.storage_path).toBe('/location/.sync')
  })

  describe('passthroughs', () => {
    const input = {
      basedir: '/location',
      folders: {},
      passthrough: {
        device_name: 'sparta',
        what_the: 'hell'
      }
    }
    const out = parseConfig(input)

    it('addes passthroughs', () => {
      expect(out.what_the).toBe('hell')
    })

    it('overrides device_name', () => {
      expect(out.device_name).toBe('sparta')
    })
  })

  describe('folders', () => {
    const input = {
      basedir: '/location/',
      folders: {
        tmp: 'XYZ'
      }
    }
    const out = parseConfig(input)

    it('contains one shared folder', () => {
      expect(out.shared_folders.length).toBe(1)
    })

    it('contains tmp entry', () => {
      expect(out.shared_folders[0].dir).toBe('/location/tmp')
      expect(out.shared_folders[0].secret).toBe('XYZ')
    })
  })
})
