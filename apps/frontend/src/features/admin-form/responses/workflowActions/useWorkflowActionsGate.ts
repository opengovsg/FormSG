import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'

import {
  featureFlags,
  sendBackMiscAllowsClearAnswers,
  sendBackMiscAllowsFixStep,
  WorkflowActionsSendBackMiscValue,
} from 'formsg-shared/constants'

export const useWorkflowActionsGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActions)

export const useWorkflowActionsSendBackGate = (): boolean =>
  useFeatureIsOn(featureFlags.workflowActionsSendBack)

export const useWorkflowActionsSendBackMisc = (): {
  canFixStep: boolean
  canClearAnswers: boolean
} => {
  const value = useFeatureValue<string>(
    featureFlags.workflowActionsSendBackMisc,
    WorkflowActionsSendBackMiscValue.OFF,
  )
  return {
    canFixStep: sendBackMiscAllowsFixStep(value),
    canClearAnswers: sendBackMiscAllowsClearAnswers(value),
  }
}
