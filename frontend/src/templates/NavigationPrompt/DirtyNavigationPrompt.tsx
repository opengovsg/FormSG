import {
  isDirtySelector,
  useDirtyFieldStore,
} from '~features/admin-form/create/builder-and-design/useDirtyFieldStore'

import { NavigationPrompt } from './NavigationPrompt'

export const DirtyNavigationPrompt = () => {
  const isDirty = useDirtyFieldStore(isDirtySelector)

  return <NavigationPrompt when={isDirty} />
}
