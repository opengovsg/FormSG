import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

export const useWorkflowActionsGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActions)

/** Send back rolls out separately from the other workflow actions. */
export const useWorkflowActionsSendBackGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActionsSendBack)
