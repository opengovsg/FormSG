import HttpStatus from 'http-status-codes'

import featureManager from '../../../config/feature-manager'

import * as verification from './verification.controller'

const verifiedFieldsFactory = ({ isEnabled }) => {
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
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      getTransactionMetadata: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      resetFieldInTransaction: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      getNewOtp: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      verifyOtp: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
    }
  }
}

export default verifiedFieldsFactory(featureManager.get('verified-fields'))
