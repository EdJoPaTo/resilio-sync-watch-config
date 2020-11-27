import {ResilioWithOwnConfigs} from '../resilio'

import {watchDebounced} from '../filesystem/watch'

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export async function runWithSpecificFiles(resilio: ResilioWithOwnConfigs, inputConfigFilePaths: readonly string[], watchInputConfigFiles: boolean): Promise<void> {
  await resilio.syncConfigFiles(...inputConfigFilePaths)

  if (watchInputConfigFiles) {
    watchDebounced(
      async () => {
        try {
          await resilio.syncConfigFiles(...inputConfigFilePaths)
        } catch (error: unknown) {
          console.error(new Date(), 'run with specific files', 'error while restarting', error)
        }
      },
      ...inputConfigFilePaths
    )
  }
}
