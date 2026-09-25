import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

export const useIsDelightfulDashboard = (): boolean =>
  useFeatureIsOn(featureFlags.delightfulDashboard)
