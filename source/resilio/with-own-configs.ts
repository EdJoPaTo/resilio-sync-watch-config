import {ResilioSync} from 'resilio-sync'

import {OwnConfig, parseConfigs} from '../config'

import {loadFromFile} from '../filesystem/own-config'

export class ResilioWithOwnConfigs {
  constructor(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
    private readonly resilio: ResilioSync
  ) {}

  async syncConfigs(...ownConfigs: ReadonlyArray<Partial<OwnConfig>>): Promise<void> {
    const resilioConfig = parseConfigs(...ownConfigs)

    await this.resilio.syncConfig(resilioConfig, (code, signal) => {
      if (code) {
        console.log(new Date(), 'ResilioWithOwnConfig', 'crashed', code, signal)
      }
    })
  }

  async syncConfigFiles(...ownConfigFiles: readonly string[]): Promise<void> {
    const ownConfigs = await loadFromFile(...ownConfigFiles)
    return this.syncConfigs(...ownConfigs)
  }

  async stop(): Promise<void> {
    await this.resilio.stop()
  }
}
