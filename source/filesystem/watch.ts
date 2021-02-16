import {watch, FSWatcher} from 'fs'

import * as debounce from 'debounce-promise'

// Due to debouncing its not clear what exactly changed.
// Arguments are omited because of that.
// Alternative would be to use accumulated debounce
type ChangeCallback = () => void

export function watchDebounced(somethingChangedCallback: ChangeCallback, ...filesOrDirectories: readonly string[]): readonly FSWatcher[] {
  const debouncedUserFunc = debounce(() => {
    somethingChangedCallback()
  }, 15000)
  const watchFunc = async (_event: string, filename: string) => {
    if (filename.endsWith('.json')) {
      await debouncedUserFunc()
    }
  }

  const watcher = filesOrDirectories
    .map(f => watch(f, {persistent: false}, watchFunc))

  return watcher
}
