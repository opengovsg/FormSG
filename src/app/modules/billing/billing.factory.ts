import { okAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'

import { getSpLoginStats } from './billing.service'

interface IBillingFactory {
  getSpLoginStats: typeof getSpLoginStats
}

const spcpFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)

// Exported for testing.
export const createBillingFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.SpcpMyInfo>): IBillingFactory => {
  if (isEnabled && props) {
    return {
      getSpLoginStats,
    }
  }

  // Not enabled, return passthrough functions.
  return {
    getSpLoginStats: () => okAsync([]),
  }
}

export const BillingFactory = createBillingFactory(spcpFeature)
