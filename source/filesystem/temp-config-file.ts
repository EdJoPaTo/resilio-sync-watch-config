import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const {mkdtempSync, unlinkSync, rmdirSync} = fs

export interface TempConfig {
  filepath: string;
  cleanupFunc: () => void;
}

function createTempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'resilio-sync-watch-config-'))
}

function configFile(tmpFolder: string): string {
  return path.join(tmpFolder, 'sync.conf')
}

function cleanup(tmpFolder: string): void {
  try {
    unlinkSync(configFile(tmpFolder))
  } catch (_) {}

  try {
    rmdirSync(tmpFolder)
  } catch (_) {}
}

export function createTempConfigFile(): TempConfig {
  const folder = createTempDir()
  const filepath = configFile(folder)
  return {
    filepath,
    cleanupFunc: () => cleanup(folder)
  }
}
