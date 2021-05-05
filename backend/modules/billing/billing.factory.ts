import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { ILoginSchema, IPopulatedForm } from '../../../types'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'

import { FormHasNoAuthError } from './billing.errors'
import * as BillingService from './billing.service'

interface IBillingFactory {
  getSpLoginStats: typeof BillingService.getSpLoginStats
  recordLoginByForm: (
    form: IPopulatedForm,
  ) => ResultAsync<
    ILoginSchema,
    FormHasNoAuthError | DatabaseError | MissingFeatureError
  >
}

const spcpFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)

// Exported for testing.
export const createBillingFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.SpcpMyInfo>): IBillingFactory => {
  if (isEnabled && props) {
    return BillingService
  }

  // Not enabled, return passthrough functions.
  const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
  return {
    getSpLoginStats: () => okAsync([]),
    recordLoginByForm: () => errAsync(error),
  }
}

export const BillingFactory = createBillingFactory(spcpFeature)
