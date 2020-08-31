import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import defaults from '../../../config/defaults'
import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../services/mail.service'
import { getRequestIp } from '../../utils/request'
import * as UserService from '../user/user.service'

import { InvalidOtpError } from './auth.errors'
import * as AuthService from './auth.service'

const logger = createLoggerWithLabel(module)

/**
 * Precondition: AuthMiddlewares.validateDomain must precede this handler.
 * @returns 200 regardless, assumed to have passed domain validation.
 */
export const handleCheckUser: RequestHandler = async (_req, res) => {
  return res.sendStatus(HttpStatus.OK)
}

/**
 * Precondition: AuthMiddlewares.validateDomain must precede this handler.
 */
export const handleLoginSendOtp: RequestHandler<
  {},
  {},
  { email: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body
  const requestIp = getRequestIp(req)
  const logMeta = {
    action: 'handleSendLoginOtp',
    email,
    ip: requestIp,
  }

  // Create OTP.
  const [otpErr, otp] = await to(AuthService.createLoginOtp(email))

  if (otpErr) {
    logger.error({
      message: 'Error generating OTP',
      meta: logMeta,
      error: otpErr,
    })
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
  }

  // Send OTP.
  const [sendErr] = await to(
    MailService.sendLoginOtp({
      recipient: email,
      otp,
      ipAddress: requestIp,
    }),
  )
  if (sendErr) {
    logger.error({
      message: 'Error mailing OTP',
      meta: logMeta,
      error: sendErr,
    })

    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        'Error sending OTP. Please try again later and if the problem persists, contact us.',
      )
  }

  // Successfully sent login otp.
  logger.info({
    message: 'Login OTP sent successfully',
    meta: logMeta,
  })

  return res.status(HttpStatus.OK).send(`OTP sent to ${email}!`)
}

/**
 * Precondition: AuthMiddlewares.validateDomain must precede this handler.
 */
export const handleLoginVerifyOtp: RequestHandler<
  {},
  {},
  { email: string; otp: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email, otp } = req.body

  const logMeta = {
    action: 'handleLoginVerifyOtp',
    email,
    ip: getRequestIp(req),
  }

  const [verifyErr] = await to(AuthService.verifyLoginOtp(otp, email))

  if (verifyErr) {
    if (verifyErr instanceof InvalidOtpError) {
      // Known error, no need to log with error.
      logger.warn({
        message: 'Login OTP is invalid',
        meta: logMeta,
        error: verifyErr,
      })

      return res.status(verifyErr.status).send(verifyErr.message)
    }

    // Not known error, log with error.
    logger.error({
      message: 'Error occurred when trying to validate login OTP',
      meta: logMeta,
      error: verifyErr,
    })

    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        'Failed to validate OTP. Please try again later and if the problem persists, contact us.',
      )
  }

  // OTP is valid, proceed to login user.
  try {
    const agency = await AuthService.getAgencyWithEmail(email)
    const user = await UserService.upsertAndReturnUser(email, agency)

    // Create user object to return to frontend.
    const userObj = { ...user.toObject(), agency }
    // TODO(#212): Should store only userId in session.
    // Add user info to session.
    req.session.user = userObj
    logger.info({
      message: `Successfully logged in user ${user.email}`,
      meta: logMeta,
    })

    return res.status(HttpStatus.OK).send(userObj)
  } catch (err) {
    logger.error({
      message: 'Error logging in user',
      meta: logMeta,
      error: err,
    })

    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        `User signin failed. Please try again later and if the problem persists, submit our Support Form (${defaults.links.supportFormLink}).`,
      )
  }
}

export const handleSignout: RequestHandler = async (req, res) => {
  if (!req.session) {
    logger.error({
      message: 'Attempted to sign out without a session',
      meta: {
        action: 'handleSignout',
      },
    })
    return res.sendStatus(HttpStatus.BAD_REQUEST)
  }

  req.session.destroy((error) => {
    if (error) {
      logger.error({
        message: 'Failed to destroy session',
        meta: {
          action: 'handleSignout',
        },
        error,
      })
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Sign out failed')
    }

    // No error.
    res.clearCookie('connect.sid')
    return res.status(HttpStatus.OK).send('Sign out successful')
  })
}
