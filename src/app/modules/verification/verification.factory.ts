import { errAsync } from 'neverthrow'

import featureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import * as VerificationService from './verification.service'

interface IVerifiedFieldsFactory {
  createTransaction: typeof VerificationService.createTransaction
  getTransactionMetadata: typeof VerificationService.getTransactionMetadata
  resetFieldForTransaction: typeof VerificationService.resetFieldForTransaction
  sendNewOtp: typeof VerificationService.sendNewOtp
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
    createTransaction: () => errAsync(error),
    getTransactionMetadata: () => errAsync(error),
    resetFieldForTransaction: () => errAsync(error),
    sendNewOtp: () => errAsync(error),
  }
}

export const VerificationFactory = createVerificationFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
