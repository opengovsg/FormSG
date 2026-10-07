import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { SubmissionMrfMetadata } from 'formsg-shared/types'

export const useWorkflowActionsGate = (mrf: SubmissionMrfMetadata): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.workflowActions)
  return isEnabled && !!mrf?.isWorkflowActionsEligible
}
