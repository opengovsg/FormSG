import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import featureManager, { FeatureNames } from '../../../config/feature-manager'

import * as verification from './verification.controller'

interface IVerifiedFieldsFactory {
  createTransaction: RequestHandler
  getTransactionMetadata: RequestHandler<{ transactionId: string }>
  resetFieldInTransaction: RequestHandler<{ transactionId: string }>
  getNewOtp: RequestHandler<{ transactionId: string }>
  verifyOtp: RequestHandler<{ transactionId: string }>
}

const verificationMiddlewareFactory = ({
  isEnabled,
}: {
  isEnabled: boolean
}): IVerifiedFieldsFactory => {
  if (isEnabled) {
    return {
      createTransaction: verification.createTransaction,
      getTransactionMetadata: verification.getTransactionMetadata,
      resetFieldInTransaction: verification.resetFieldInTransaction,
      getNewOtp: verification.getNewOtp,
      verifyOtp: verification.verifyOtp,
    }
  } else {
    const errMsg = 'Verified fields feature is not enabled'
    return {
      createTransaction: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      getTransactionMetadata: (req, res) =>
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

export const verificationMiddleware = verificationMiddlewareFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
