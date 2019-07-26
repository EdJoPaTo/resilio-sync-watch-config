import {ResilioWithOwnConfigs} from '../resilio'

import {watchDebounced} from '../filesystem/watch'

export async function runWithSpecificFiles(resilio: ResilioWithOwnConfigs, inputConfigFilePaths: string[], watchInputConfigFiles: boolean): Promise<void> {
  await resilio.syncConfigFiles(...inputConfigFilePaths)

  if (watchInputConfigFiles) {
    watchDebounced(
      async () => {
        try {
          await resilio.syncConfigFiles(...inputConfigFilePaths)
        } catch (error) {
          console.error(new Date(), 'run with specific files', 'error while restarting', error)
        }
      },
      ...inputConfigFilePaths
    )
  }
}
