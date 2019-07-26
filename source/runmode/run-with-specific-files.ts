import {ResilioWithOwnConfigs} from '../resilio'

import {watchDebounced} from '../filesystem/watch'

export async function runWithSpecificFiles(resilio: ResilioWithOwnConfigs, inputConfigFilePaths: string[], watchInputConfigFiles: boolean): Promise<void> {
  await resilio.syncConfigFiles(...inputConfigFilePaths)

  if (watchInputConfigFiles) {
    watchDebounced(
      async () => resilio.syncConfigFiles(...inputConfigFilePaths),
      ...inputConfigFilePaths
    )
  }
}
