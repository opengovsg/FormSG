import { useCallback, useEffect } from 'react'

import { GUIDED_WORKFLOW_MODE_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

import {
  DEFAULT_IS_GUIDED_SETUP,
  isGuidedSetupSelector,
  setGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'

export interface GuidedSetupPreference {
  isGuidedSetup: boolean
  setGuidedSetup: (isGuidedSetup: boolean) => void
}

export const useGuidedSetupPreference = (): GuidedSetupPreference => {
  const { user } = useUser()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const setGuidedSetupInStore = useAdminWorkflowStore(setGuidedSetupSelector)

  const storageKey = user?._id
    ? `${GUIDED_WORKFLOW_MODE_KEY_PREFIX}${user._id}`
    : null
  const [storedPreference, setStoredPreference] = useLocalStorage<boolean>(
    storageKey,
    DEFAULT_IS_GUIDED_SETUP,
  )

  useEffect(() => {
    if (storedPreference === undefined) return
    if (storedPreference === isGuidedSetup) return
    setGuidedSetupInStore(storedPreference)
  }, [storedPreference, isGuidedSetup, setGuidedSetupInStore])

  const setGuidedSetup = useCallback(
    (next: boolean) => {
      setStoredPreference(next)
      setGuidedSetupInStore(next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setGuidedSetupInStore, storageKey],
  )

  return { isGuidedSetup, setGuidedSetup }
}
