import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'

import featureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import * as verification from './verification.controller'
import * as VerificationService from './verification.service'

interface IVerifiedFieldsMiddleware {
  createTransaction: RequestHandler
  resetFieldInTransaction: RequestHandler<{ transactionId: string }>
  getNewOtp: RequestHandler<{ transactionId: string }>
  verifyOtp: RequestHandler<{ transactionId: string }>
}

const verificationMiddlewareFactory = ({
  isEnabled,
}: {
  isEnabled: boolean
}): IVerifiedFieldsMiddleware => {
  if (isEnabled) {
    return {
      createTransaction: verification.createTransaction,
      resetFieldInTransaction: verification.resetFieldInTransaction,
      getNewOtp: verification.getNewOtp,
      verifyOtp: verification.verifyOtp,
    }
  } else {
    const errMsg = 'Verified fields feature is not enabled'
    return {
      createTransaction: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      resetFieldInTransaction: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      getNewOtp: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      verifyOtp: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
    }
  }
}
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

export const verificationMiddleware = verificationMiddlewareFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)

export const VerificationFactory = createVerificationFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
