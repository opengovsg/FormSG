import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

export const useIsWorkflowEmailSourceInput = (): boolean =>
  useFeatureIsOn(featureFlags.workflowEmailSourceInput)
