import { errAsync } from 'neverthrow'

import featureManager, { FeatureNames } from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import * as VerificationService from './verification.service'

interface IVerifiedFieldsFactory {
  createTransaction: typeof VerificationService.createTransaction
  getTransactionMetadata: typeof VerificationService.getTransactionMetadata
  resetFieldForTransaction: typeof VerificationService.resetFieldForTransaction
  sendNewOtp: typeof VerificationService.sendNewOtp
  verifyOtp: typeof VerificationService.verifyOtp
}

export const createVerificationFactory = ({
  isEnabled,
}: {
  isEnabled: boolean
}): IVerifiedFieldsFactory => {
  if (isEnabled) {
    return VerificationService
  }
  const error = new MissingFeatureError(FeatureNames.VerifiedFields)
  return {
    createTransaction: () => errAsync(error),
    getTransactionMetadata: () => errAsync(error),
    resetFieldForTransaction: () => errAsync(error),
    sendNewOtp: () => errAsync(error),
    verifyOtp: () => errAsync(error),
  }
}

export const VerificationFactory = createVerificationFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
