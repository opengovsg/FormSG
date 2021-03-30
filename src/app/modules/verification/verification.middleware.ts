import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import featureManager, { FeatureNames } from '../../../config/feature-manager'

import * as verification from './verification.controller'

interface IVerifiedFieldsMiddleware {
  verifyOtp: RequestHandler<{ transactionId: string }>
}

const verificationMiddlewareFactory = ({
  isEnabled,
}: {
  isEnabled: boolean
}): IVerifiedFieldsMiddleware => {
  if (isEnabled) {
    return {
      verifyOtp: verification.verifyOtp,
    }
  } else {
    const errMsg = 'Verified fields feature is not enabled'
    return {
      verifyOtp: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
    }
  }
}
export const verificationMiddleware = verificationMiddlewareFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
