'use strict'

const formsgSdk = require('../../config/formsg-sdk')
const { isEmpty } = require('lodash')

const { StatusCodes } = require('http-status-codes')

const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const { mapDataToKey } = require('../../shared/util/verified-content')

const jwtNames = {
  SP: 'jwtSp',
  CP: 'jwtCp',
}

/**
 * Encrypt and sign verified fields if exist
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.encryptedVerifiedFields = (signingSecretKey) => {
  return (req, res, next) => {
    const authType = req.form && req.form.authType
    // Early return if this is not a Singpass/Corppass submission.
    if (!authType) return next()

    const verifiedContent = mapDataToKey({ type: authType, data: res.locals })

    if (isEmpty(verifiedContent)) return next()

    try {
      const encryptedVerified = formsgSdk.crypto.encrypt(
        verifiedContent,
        req.form.publicKey,
        signingSecretKey,
      )

      res.locals.verified = encryptedVerified
      return next()
    } catch (error) {
      logger.error({
        message: 'Unable to encrypt verified content',
        meta: {
          action: 'encryptedVerifiedFields',
          formId: req.form._id,
          ...createReqMeta(req),
        },
        error,
      })
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid data was found. Please submit again.' })
    }
  }
}

/**
 * Append additional verified responses(s) for SP and CP responses so that they show up in email response
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.appendVerifiedSPCPResponses = function (req, res, next) {
  const { form } = req
  const { uinFin, userInfo } = res.locals
  switch (form.authType) {
    case 'SP':
      req.body.parsedResponses.push({
        question: 'SingPass Validated NRIC',
        fieldType: 'authenticationSp',
        isVisible: true,
        answer: uinFin,
      })
      break
    case 'CP':
      // Add UEN to responses
      req.body.parsedResponses.push({
        question: 'CorpPass Validated UEN',
        fieldType: 'authenticationCp',
        isVisible: true,
        answer: uinFin,
      })
      // Add UID to responses
      req.body.parsedResponses.push({
        question: 'CorpPass Validated UID',
        fieldType: 'authenticationCp',
        isVisible: true,
        answer: userInfo,
      })
      break
  }
  return next()
}
