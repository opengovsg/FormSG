'use strict'

const config = require('../../config/config')
const formsgSdk = require('../../config/formsg-sdk')
const { isEmpty } = require('lodash')

const mongoose = require('mongoose')
const crypto = require('crypto')
const { StatusCodes } = require('http-status-codes')

const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const { mapDataToKey } = require('../../shared/util/verified-content')
const getFormModel = require('../models/form.server.model').default
const getLoginModel = require('../models/login.server.model').default
const Form = getFormModel(mongoose)
const Login = getLoginModel(mongoose)

const jwtNames = {
  SP: 'jwtSp',
  CP: 'jwtCp',
}
const destinationRegex = /^\/([\w]+)\/?/

const getForm = function (destination, cb) {
  let formId = destinationRegex.exec(destination)[1]
  Form.findById({ _id: formId })
    .populate({
      path: 'admin',
      populate: {
        path: 'agency',
        model: 'Agency',
      },
    })
    .exec(cb)
}

const destinationIsValid = function (destination) {
  // Parse formId from the string
  // e.g. "/5b9b5fcfdb4da66ef52b73b3/preview" -> "5b9b5fcfdb4da66ef52b73b3"
  // with or without "/preview"
  if (!destination || !destinationRegex.test(destination)) {
    return false
  }
  return true
}

const isArtifactValid = function (idpPartnerEntityIds, samlArt, authType) {
  // Artifact should be 44 bytes long, of type 0x0004 and
  // source id should be SHA-1 hash of the issuer's entityID
  let hexEncodedArtifact = Buffer.from(samlArt, 'base64').toString('hex')
  let artifactHexLength = hexEncodedArtifact.length
  let typeCode = parseInt(hexEncodedArtifact.substr(0, 4))
  let sourceId = hexEncodedArtifact.substr(8, 40)
  let hashedEntityId = crypto
    .createHash('sha1')
    .update(idpPartnerEntityIds[authType], 'utf8')
    .digest('hex')

  return (
    artifactHexLength === 88 && typeCode === 4 && sourceId === hashedEntityId
  )
}

const isValidAuthenticationQuery = (
  destination,
  idpPartnerEntityIds,
  samlArt,
  authType,
) => {
  return (
    destination &&
    isArtifactValid(idpPartnerEntityIds, samlArt, authType) &&
    destinationRegex.test(destination)
  )
}

const handleOOBAuthenticationWith = (ndiConfig, authType, extractUser) => {
  const {
    authClients,
    cpCookieMaxAge,
    spCookieMaxAgePreserved,
    spCookieMaxAge,
    spcpCookieDomain,
    idpPartnerEntityIds,
  } = ndiConfig
  return function (req, res) {
    let authClient = authClients[authType] ? authClients[authType] : undefined
    let jwtName = jwtNames[authType]
    let { SAMLart: samlArt, RelayState: relayState } = req.query
    const payloads = String(relayState).split(',')

    if (payloads.length !== 2) {
      return res.sendStatus(StatusCodes.BAD_REQUEST)
    }

    const destination = payloads[0]
    const rememberMe = payloads[1] === 'true'

    if (
      !isValidAuthenticationQuery(
        destination,
        idpPartnerEntityIds,
        samlArt,
        authType,
      )
    ) {
      res.sendStatus(StatusCodes.UNAUTHORIZED)
      return
    }

    // Resolve known express req.query issue where pluses become spaces
    samlArt = String(samlArt).replace(/ /g, '+')

    if (!destinationIsValid(destination))
      return res.sendStatus(StatusCodes.BAD_REQUEST)

    getForm(destination, (err, form) => {
      if (err || !form || form.authType !== authType) {
        res.sendStatus(StatusCodes.NOT_FOUND)
        return
      }
      authClient.getAttributes(samlArt, destination, (err, data) => {
        if (err) {
          logger.error({
            message: 'Error retrieving attributes from auth client',
            meta: {
              action: 'handleOOBAuthenticationWith',
              ...createReqMeta(req),
            },
            error: err,
          })
        }
        const { attributes } = data
        const { userName, userInfo } = extractUser(attributes)
        if (userName && destination) {
          // Create JWT
          let payload = {
            userName,
            userInfo,
            rememberMe,
          }

          let cookieDuration
          if (authType === 'CP') {
            cookieDuration = cpCookieMaxAge
          } else {
            cookieDuration = rememberMe
              ? spCookieMaxAgePreserved
              : spCookieMaxAge
          }

          let jwt = authClient.createJWT(
            payload,
            cookieDuration / 1000,
            // NOTE: cookieDuration is interpreted as a seconds count if numeric.
          )
          // Add login to DB
          Login.addLoginFromForm(form).then(() => {
            const spcpSettings = spcpCookieDomain
              ? { domain: spcpCookieDomain, path: '/' }
              : {}
            // Redirect to form
            res.cookie(jwtName, jwt, {
              maxAge: cookieDuration,
              httpOnly: false, // the JWT needs to be read by client-side JS
              sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
              secure: !config.isDev,
              ...spcpSettings,
            })
            res.redirect(destination)
          })
        } else if (destination) {
          res.cookie('isLoginError', true)
          res.redirect(destination)
        } else {
          res.redirect('/')
        }
      })
    })
  }
}

/**
 * Assertion Consumer Endpoint - Authenticates form-filler with SingPass and creates session
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.singPassLogin = (ndiConfig) => {
  return handleOOBAuthenticationWith(ndiConfig, 'SP', (attributes) => {
    let userName = attributes && attributes.UserName
    return userName ? { userName } : {}
  })
}

/**
 * Assertion Consumer Endpoint - Authenticates form-filler with CorpPass and creates session
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.corpPassLogin = (ndiConfig) => {
  return handleOOBAuthenticationWith(ndiConfig, 'CP', (attributes) => {
    let userName =
      attributes && attributes.UserInfo && attributes.UserInfo.CPEntID
    let userInfo =
      attributes && attributes.UserInfo && attributes.UserInfo.CPUID
    return userName && userInfo ? { userName, userInfo } : {}
  })
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
