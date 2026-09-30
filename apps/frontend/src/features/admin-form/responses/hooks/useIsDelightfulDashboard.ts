import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { isWorkflowPrototype } from '../prototype/config'

export const useIsDelightfulDashboard = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.delightfulDashboard)
  return isWorkflowPrototype || isEnabled
}
