import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Single source of truth for the `mrf-singpass-all-steps` GrowthBook flag. It
 * gates the admin UI only: respondent paths honour a saved step login
 * regardless. Later-step login fills NRIC/FIN/UEN fields, so it also needs
 * `is-nric-field-enabled`.
 */
export const useIsMrfStepLoginEnabled = (): boolean => {
  const isStepLoginOn = useFeatureIsOn(featureFlags.mrfStepLogin)
  const isNricFieldOn = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  return isStepLoginOn && isNricFieldOn
}
