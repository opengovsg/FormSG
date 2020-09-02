'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const getUserModel = require('../models/user.server.model').default
const getTokenModel = require('../models/token.server.model').default
const getAgencyModel = require('../models/agency.server.model').default

const User = getUserModel(mongoose)
const Token = getTokenModel(mongoose)
const Agency = getAgencyModel(mongoose)
const bcrypt = require('bcrypt')
const validator = require('validator')
const { StatusCodes } = require('http-status-codes')

const config = require('../../config/config')
const { LINKS } = require('../shared/constants')
const PERMISSIONS = require('../utils/permission-levels').default
const { getRequestIp } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const { generateOtp } = require('../utils/otp')
const MailService = require('../services/mail.service').default

const MAX_OTP_ATTEMPTS = 10

/**
 * Middleware that authenticates admin-user
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.authenticateUser = function (req, res, next) {
  if (req.session && req.session.user) {
    return next()
  } else {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send({ message: 'User is unauthorized.' })
  }
}

/**
 * Checks if domain is from a whitelisted agency
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.validateDomain = function (req, res, next) {
  let email = req.body.email
  let emailDomain = String(validator.isEmail(email) && email.split('@').pop())
  Agency.findOne({ emailDomain }, function (err, agency) {
    // Database issues
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(
          `Unable to validate email domain. If this issue persists, please submit a Support Form (${LINKS.supportFormLink}).`,
        )
    }
    // Agency not found
    if (!agency) {
      logger.error({
        message: 'Agency not found',
        meta: {
          action: 'validateDomain',
          email,
          emailDomain,
          ip: getRequestIp(req),
        },
        error: err,
      })
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
        )
    }
    // Agency whitelisted
    res.locals = {
      agency,
      email,
    }
    return next()
  })
}

/**
 * Returns a middleware function that ensures that only users with the requiredPermission will pass.
 * @param {String} requiredPermission - Either 'write' or 'delete', indicating what level of authorization
 *                                   the user needs
 * @returns {function({Object}, {Object}, {Object})} - A middleware function that takes req, the express
 *   request object, and res, the express response object.
 */
exports.verifyPermission = (requiredPermission) =>
  /**
   * Middleware function that ensures only those with the required permission level will pass.
   * @param {Object} req - Express request object
   * @param {Object} req.form - The form object retrieved from the DB
   * @param {Object} req.session - The session info of the query
   * @param {Object} res - Express response object
   * @param {function} next - Next middleware function
   */
  (req, res, next) => {
    // Admins always have sufficient permission
    let hasSufficientPermission =
      String(req.form.admin.id) === String(req.session.user._id)
    // Write users can access forms that require write/read
    if (
      requiredPermission === PERMISSIONS.WRITE ||
      requiredPermission === PERMISSIONS.READ
    ) {
      hasSufficientPermission =
        hasSufficientPermission ||
        req.form.permissionList.find(
          (userObj) =>
            userObj.email === req.session.user.email && userObj.write,
        )
    }
    // Read users can access forms that require read permissions
    if (requiredPermission === PERMISSIONS.READ) {
      hasSufficientPermission =
        hasSufficientPermission ||
        req.form.permissionList.find(
          (userObj) => userObj.email === req.session.user.email,
        )
    }

    if (hasSufficientPermission) {
      return next()
    } else {
      return res.status(StatusCodes.FORBIDDEN).send({
        message:
          'User ' +
          req.session.user.email +
          ' is not authorized to perform this operation on Form: ' +
          req.form.title +
          '.',
      })
    }
  }

/**
 * Create OTP using bcrypt and save to DB
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.createOtp = function (req, res, next) {
  // 1. Create 6 digit OTP using crypto
  // 2. Hash OTP using bcrypt. OTP expires in 15 mins
  // 3. Save OTP to DB

  let email = res.locals.email
  let otp = generateOtp()
  bcrypt.hash(otp, 10, function (bcryptErr, hashedOtp) {
    if (bcryptErr) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(
          'Error generating OTP. Please try again later and if the problem persists, contact us.',
        )
    }

    let record = {
      email: email,
      hashedOtp: hashedOtp,
      numOtpAttempts: 0,
      expireAt: new Date(Date.now() + config.otpLifeSpan),
    }

    Token.findOneAndUpdate(
      { email: email },
      {
        $set: record,
      },
      { w: 1, upsert: true, new: true },
      function (updateErr, updatedRecord) {
        if (updateErr) {
          logger.error({
            message: 'Token update error',
            meta: {
              action: 'createOtp',
              ip: getRequestIp(req),
              url: req.url,
              headers: req.headers,
            },
            error: updateErr,
          })
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send(
              'Error saving OTP. Please try again later and if the problem persists, contact us.',
            )
        }

        res.locals.otp = otp
        res.locals.expireAt = updatedRecord.expireAt
        return next()
      },
    )
  })
}

/**
 * Sends OTP using mail transport
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.sendOtp = async function (req, res) {
  // 1. Configure email with OTP to be sent to user email
  // 2. Return success statement to front end

  let otp = res.locals.otp
  let recipient = res.locals.email

  try {
    await MailService.sendLoginOtp({
      recipient,
      otp,
      ipAddress: getRequestIp(req),
    })
    logger.info({
      message: 'Login OTP sent',
      meta: {
        action: 'sendOtp',
        ip: getRequestIp(req),
        email: recipient,
      },
    })
    return res.status(StatusCodes.OK).send(`OTP sent to ${recipient}!`)
  } catch (err) {
    logger.error({
      message: 'Mail otp error',
      meta: {
        action: 'sendOtp',
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
      },
      error: err,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        'Error sending OTP. Please try again later and if the problem persists, contact us.',
      )
  }
}

/**
 * Verify OTP using bcrypt
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.verifyOtp = function (req, res, next) {
  // 1. Increment the number of times this particular OTP has been attempted.
  // * Upsert is false as we do not want OTP to be added to DB if not already present
  // * We read and write to numOtpAttempts in findOneAndUpdate command to prevent concurrency issues
  // 2. If number of attempts is more than max allowed, block user
  // 3. Compare OTP given to hashed OTP in db
  // 4. If OTP is correct, remove OTP from token table and call next()
  let otp = req.body.otp
  let email = res.locals.email

  let upsertData = {
    $inc: { numOtpAttempts: 1 },
  }

  Token.findOneAndUpdate(
    { email: email },
    upsertData,
    { w: 1, upsert: false, new: true },
    function (updateErr, updatedRecord) {
      if (updateErr) {
        logger.error({
          message: 'Error updating Token in database',
          meta: {
            action: 'verifyOtp',
            email,
            ip: getRequestIp(req),
          },
          error: updateErr,
        })
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(
            `Unable to login at this time. Please submit a Support Form (${LINKS.supportFormLink}).`,
          )
      }
      if (!updatedRecord) {
        logger.info({
          message: 'Expired OTP',
          meta: {
            action: 'verifyOtp',
            ip: getRequestIp(req),
            email,
          },
        })
        return res
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .send('OTP has expired. Click Resend to receive a new OTP.')
      }
      if (updatedRecord.numOtpAttempts > MAX_OTP_ATTEMPTS) {
        logger.info({
          message: 'Exceeded max OTP attempts',
          meta: {
            action: 'verifyOtp',
            ip: getRequestIp(req),
            email,
          },
        })
        return res
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .send(
            'You have hit the max number of attempts for this OTP. Click Resend to receive a new OTP.',
          )
      }
      bcrypt.compare(otp, updatedRecord.hashedOtp, function (
        bcryptErr,
        isCorrect,
      ) {
        if (bcryptErr) {
          logger.error({
            message: 'Malformed OTP',
            meta: {
              action: 'verifyOtp',
              ip: getRequestIp(req),
            },
            error: bcryptErr,
          })
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send(
              'Malformed OTP. Please try again later and if the problem persists, contact us.',
            )
        }
        if (isCorrect) {
          Token.findOneAndRemove({ email: email }, function (removeErr) {
            if (removeErr) {
              logger.error({
                message: 'Error removing Token in database',
                meta: {
                  action: 'verifyOtp',
                  email,
                  ip: getRequestIp(req),
                },
                error: removeErr,
              })
              return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                  'Failed to validate OTP. Please try again later and if the problem persists, contact us.',
                )
            } else {
              return next()
            }
          })
        } else {
          logger.info({
            message: 'Invalid OTP',
            meta: {
              action: 'verifyOtp',
              email,
              ip: getRequestIp(req),
            },
          })
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .send('OTP is invalid. Please try again.')
        }
      })
    },
  )
}

/**
 * Creates/updates user object and returns obj to client
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.signIn = function (req, res) {
  // 1. Save user information to DB. Set agency id for new users
  // 2. Start session by adding user and agency information to session object. Return user object to front end

  let email = res.locals.email
  let agency = res.locals.agency

  let record = {
    email: email,
    agency: agency._id,
  }
  let upsertData = {
    $set: record,
    $setOnInsert: {
      created: new Date(),
    },
  }
  User.findOneAndUpdate(
    { email: email },
    upsertData,
    {
      w: 1,
      upsert: true,
      new: true,
      runValidators: true, // Update validators are off by default - need to specify the runValidators option.
      setDefaultsOnInsert: true, // Otherwise, defaults will not be set on update and findOneAndUpdate
    },
    function (updateErr, user) {
      if (updateErr || !user) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(
            `User signin failed. Please try again later and if the problem persists, submit our Support Form (${LINKS.supportFormLink}).`,
          )
      }
      let userObj = {
        agency: agency,
        email: user.email,
        contact: user.contact,
        _id: user._id,
        betaFlags: user.betaFlags,
      }

      // Add user info to session
      req.session.user = userObj
      logger.info({
        message: 'Successful login',
        meta: {
          action: 'signIn',
          email,
          ip: getRequestIp(req),
        },
      })
      return res.status(StatusCodes.OK).send(userObj)
    },
  )
}

/**
 * Sign out from session
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.signOut = function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Sign out failed')
    } else {
      res.clearCookie('connect.sid')
      return res.status(StatusCodes.OK).send('Sign out successful')
    }
  })
}

/**
 * Verifies if a request was sent by a user that has the beta flag enabled for a betaType
 * @param  {String} betaType - beta flag in User schema
 * @param  {Object} req - Express request object
 * @param  {Object} req.session - session from express-session
 * @param  {Object} [req.session.user] - user object with properties
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next object
 */

exports.doesUserBeta = (betaType) => (req, res, next) => {
  const { session } = req
  const { user } = session
  if (user && user.betaFlags && user.betaFlags[betaType]) {
    return next()
  } else {
    return res.status(StatusCodes.FORBIDDEN).send({
      message: `User is not authorized to access beta feature: ${betaType}`,
    })
  }
}
