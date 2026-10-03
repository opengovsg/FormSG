import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Whether Corppass forms log in with FormSG's own e-service ID, so admins no
 * longer supply one.
 */
export const useIsCorppassFormsgEsrvcIdEnabled = (): boolean =>
  useFeatureIsOn(featureFlags.corppassFormsgEsrvcId)
