import { errAsync } from 'neverthrow'

import featureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import * as VerificationService from './verification.service'

interface IVerifiedFieldsFactory {
  getTransactionMetadata: typeof VerificationService.getTransactionMetadata
}

export const createVerificationFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.VerifiedFields>): IVerifiedFieldsFactory => {
  if (isEnabled && props) {
    return VerificationService
  }
  const error = new MissingFeatureError(FeatureNames.VerifiedFields)
  return {
    getTransactionMetadata: () => errAsync(error),
  }
}

export const VerificationFactory = createVerificationFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
