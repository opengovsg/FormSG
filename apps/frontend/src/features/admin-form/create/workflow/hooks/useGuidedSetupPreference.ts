import { useCallback, useEffect } from 'react'

import { GUIDED_WORKFLOW_MODE_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

import {
  isGuidedSetupSelector,
  setGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'

export interface GuidedSetupPreference {
  isGuidedSetup: boolean
  setGuidedSetup: (isGuidedSetup: boolean) => void
}

/**
 * The admin's guided-mode choice, remembered per browser and shared across
 * their forms. The store stays the read surface every consumer already uses;
 * this keeps it in step with the stored choice and writes both on a change.
 */
export const useGuidedSetupPreference = (): GuidedSetupPreference => {
  const { user } = useUser()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const setGuidedSetupInStore = useAdminWorkflowStore(setGuidedSetupSelector)

  const storageKey = user?._id
    ? `${GUIDED_WORKFLOW_MODE_KEY_PREFIX}${user._id}`
    : null
  const [storedPreference, setStoredPreference] =
    useLocalStorage<boolean>(storageKey)

  // An admin who has never chosen keeps the guided default.
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
    // setStoredPreference is redefined every render by useLocalStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setGuidedSetupInStore, storageKey],
  )

  return { isGuidedSetup, setGuidedSetup }
}
