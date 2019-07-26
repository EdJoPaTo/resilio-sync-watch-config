import {watch} from 'fs'

import debounce from 'debounce-promise'

// Due to debouncing its not clear what exactly changed.
// Arguments are omited because of that.
// Alternative would be to use accumulated debounce
type ChangeCallback = () => void

export function watchDebounced(somethingChangedCallback: ChangeCallback, ...filesOrDirectories: readonly string[]): void {
  const watchFunc = debounce(() => somethingChangedCallback(), 500)
  for (const f of filesOrDirectories) {
    watch(f, {persistent: false}, watchFunc)
  }
}
