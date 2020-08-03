const featureManager = require('../../config/feature-manager').default
const verification = require('../../app/controllers/verification.server.controller')
const HttpStatus = require('http-status-codes')

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

module.exports = verifiedFieldsFactory(featureManager.get('verified-fields'))
