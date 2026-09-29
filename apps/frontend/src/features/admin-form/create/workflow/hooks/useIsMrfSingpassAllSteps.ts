import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/** `mrf-singpass-all-steps`: gates editing step login only; saved logins always show. */
export const useIsMrfSingpassAllSteps = (): boolean =>
  useFeatureIsOn(featureFlags.mrfSingpassAllSteps)
