import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Single source of truth for the `mrf-step-login` GrowthBook flag. It gates
 * the admin UI only: respondent paths honour a saved step login regardless.
 */
export const useIsMrfStepLoginEnabled = (): boolean =>
  useFeatureIsOn(featureFlags.mrfStepLogin)
