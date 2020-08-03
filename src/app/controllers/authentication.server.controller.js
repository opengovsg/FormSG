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
const HttpStatus = require('http-status-codes')
const _ = require('lodash')

const config = require('../../config/config')
const defaults = require('../../config/defaults').default
const PERMISSIONS = require('../utils/permission-levels.js')
const { getRequestIp } = require('../utils/request')
const { renderPromise } = require('../utils/render-promise')
const logger = require('../../config/logger').createLoggerWithLabel(
  'authentication',
)
const { sendNodeMail } = require('../services/mail.service')
const { EMAIL_HEADERS, EMAIL_TYPES } = require('../utils/constants')

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
      .status(HttpStatus.UNAUTHORIZED)
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
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          `Unable to validate email domain. If this issue persists, please submit a Support Form (${defaults.links.supportFormLink}).`,
        )
    }
    // Agency not found
    if (!agency) {
      logger.error(
        `Agency not found:\temail=${email} emailDomain=${emailDomain} ip=${getRequestIp(
          req,
        )}`,
      )
      return res
        .status(HttpStatus.UNAUTHORIZED)
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
      return res.status(HttpStatus.FORBIDDEN).send({
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
 * Returns a middleware function that ensures that only admins with the requiredBeta will pass. Note that
 * this verifies permissions for the form admin, regardless of the curernt user.
 * @param {String} requiredBeta - Key of required beta in betaFlags object in user
 * @returns {function({Object}, {Object}, {Object})} - A middleware function that takes req, the express
 *   request object, and res, the express response object.
 */
exports.verifyAdminBeta = (requiredBeta) => {
  /**
   * Middleware function that only allows form admin with the required beta permission.
   * @param {Object} req - Express request object
   * @param {Object} req.form - The form object retrieved from the DB
   * @param {Object} res - Express response object
   * @param {function} next - Next middleware function
   */
  return (req, res, next) => {
    if (!_.get(req.form, 'admin.betaFlags.' + requiredBeta, false)) {
      return res.status(HttpStatus.FORBIDDEN).send({
        message: `User is not authorized to access beta feature: ${requiredBeta}`,
      })
    }
    return next()
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
  let otp = config.otpGenerator()
  bcrypt.hash(otp, 10, function (bcryptErr, hashedOtp) {
    if (bcryptErr) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
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
          logger.error(getRequestIp(req), req.url, req.headers, updateErr)
          return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
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
  let email = res.locals.email

  let emailHTML
  try {
    emailHTML = await renderPromise(res, 'templates/otp-email', {
      appName: res.app.locals.title,
      appUrl: config.app.appUrl,
      otp: otp,
    })
  } catch (renderErr) {
    logger.error(getRequestIp(req), req.url, req.headers, renderErr)
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        'Error rendering OTP. Please try again later and if the problem persists, contact us.',
      )
  }
  let mailOptions = {
    to: email,
    from: config.mail.mailer.from,
    subject: 'One-Time Password (OTP) for ' + res.app.locals.title,
    html: emailHTML,
    headers: {
      [EMAIL_HEADERS.emailType]: EMAIL_TYPES.loginOtp,
    },
  }
  try {
    await sendNodeMail({
      mail: mailOptions,
      options: { mailId: 'OTP' },
    })
    logger.info(`Login OTP sent:\temail=${email} ip=${getRequestIp(req)}`)
    return res.status(HttpStatus.OK).send('OTP sent to ' + email + '!')
  } catch (emailErr) {
    logger.error(
      'Mail otp error',
      getRequestIp(req),
      req.url,
      req.headers,
      emailErr,
    )
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
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
        logger.error(
          `Failed to validate OTP (updateErr)\temail=${email} ip=${getRequestIp(
            req,
          )}`,
        )
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send(
            `Unable to login at this time. Please submit a Support Form (${defaults.links.supportFormLink}).`,
          )
      }
      if (!updatedRecord) {
        logger.info(`Expired OTP\temail=${email} ip=${getRequestIp(req)}`)
        return res
          .status(HttpStatus.UNPROCESSABLE_ENTITY)
          .send('OTP has expired. Click Resend to receive a new OTP.')
      }
      if (updatedRecord.numOtpAttempts > MAX_OTP_ATTEMPTS) {
        logger.info(
          `Exceeded max OTP attempts\temail=${email} ip=${getRequestIp(req)}`,
        )
        return res
          .status(HttpStatus.UNPROCESSABLE_ENTITY)
          .send(
            'You have hit the max number of attempts for this OTP. Click Resend to receive a new OTP.',
          )
      }
      bcrypt.compare(otp, updatedRecord.hashedOtp, function (
        bcryptErr,
        isCorrect,
      ) {
        if (bcryptErr) {
          logger.error(`Malformed OTP\temail=${email} ip=${getRequestIp(req)}`)
          return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send(
              'Malformed OTP. Please try again later and if the problem persists, contact us.',
            )
        }
        if (isCorrect) {
          Token.findOneAndRemove({ email: email }, function (removeErr) {
            if (removeErr) {
              logger.error(
                `Failed to validate OTP (removeErr)\temail=${email} ip=${getRequestIp(
                  req,
                )}`,
              )
              return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send(
                  'Failed to validate OTP. Please try again later and if the problem persists, contact us.',
                )
            } else {
              return next()
            }
          })
        } else {
          logger.info(`Invalid OTP\temail=${email} ip=${getRequestIp(req)}`)
          return res
            .status(HttpStatus.UNAUTHORIZED)
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
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send(
            `User signin failed. Please try again later and if the problem persists, submit our Support Form (${defaults.links.supportFormLink}).`,
          )
      }
      let userObj = {
        agency: agency,
        email: user.email,
        _id: user._id,
        betaFlags: user.betaFlags,
      }

      // Add user info to session
      req.session.user = userObj
      logger.info(
        `Successful Login:\temail=${user.email} ip=${getRequestIp(req)}`,
      )
      return res.status(HttpStatus.OK).send(userObj)
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
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Sign out failed')
    } else {
      res.clearCookie('connect.sid')
      return res.status(HttpStatus.OK).send('Sign out successful')
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
    return res.status(HttpStatus.FORBIDDEN).send({
      message: `User is not authorized to access beta feature: ${betaType}`,
    })
  }
}
