import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Single source of truth for reading the `mrf-singpass-all-steps` GrowthBook
 * flag. It gates admin changes to later-step login only: saved logins are
 * still shown when the flag is off.
 */
export const useIsMrfSingpassAllSteps = (): boolean =>
  useFeatureIsOn(featureFlags.mrfSingpassAllSteps)
