import { useCallback } from 'react'

import { SeenFlags } from 'formsg-shared/types'

import { GUIDED_WORKFLOW_SETUP_TAUGHT } from '~features/user/constants'
import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'

export interface GuidedSetupTaught {
  hasBeenTaught: boolean
  markTaught: () => void
}

export const useGuidedSetupTaught = (): GuidedSetupTaught => {
  const { user } = useUser()
  const { updateLastSeenFlagMutation } = useUserMutations()

  const flagValue = user?.flags?.[SeenFlags.GuidedWorkflowSetup]

  const markTaught = useCallback(() => {
    updateLastSeenFlagMutation.mutate({
      flag: SeenFlags.GuidedWorkflowSetup,
      version: GUIDED_WORKFLOW_SETUP_TAUGHT,
    })
  }, [updateLastSeenFlagMutation])

  return {
    hasBeenTaught:
      flagValue !== undefined && flagValue >= GUIDED_WORKFLOW_SETUP_TAUGHT,
    markTaught,
  }
}
