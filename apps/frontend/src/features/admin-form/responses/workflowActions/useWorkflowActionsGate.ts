import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

export const useWorkflowActionsGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActions)

export const useWorkflowActionsSendBackGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActionsSendBack)
