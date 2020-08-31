import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import featureManager from '../../../config/feature-manager'
import { FeatureNames } from '../../../config/feature-manager/types'

import * as verification from './verification.controller'

interface IVerifiedFieldsFactory {
  createTransaction: RequestHandler
  getTransactionMetadata: RequestHandler
  resetFieldInTransaction: RequestHandler
  getNewOtp: RequestHandler
  verifyOtp: RequestHandler
}

const verifiedFieldsFactory = ({
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
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errMsg),
      getTransactionMetadata: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errMsg),
      resetFieldInTransaction: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errMsg),
      getNewOtp: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errMsg),
      verifyOtp: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errMsg),
    }
  }
}

export default verifiedFieldsFactory(
  featureManager.get(FeatureNames.VerifiedFields),
)
