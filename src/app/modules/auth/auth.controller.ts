import to from 'await-to-js'
import { Request, RequestHandler, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { isEmpty } from 'lodash'

import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { LINKS } from '../../../shared/constants'
import MailService from '../../services/mail.service'
import { getRequestIp } from '../../utils/request'
import { ApplicationError, DatabaseError } from '../core/core.errors'
import * as UserService from '../user/user.service'

import { InvalidDomainError } from './auth.errors'
import * as AuthService from './auth.service'
import { ResponseAfter, SessionUser } from './auth.types'

const logger = createLoggerWithLabel(module)

const handleError = ({
  error,
  res,
  logMeta,
}: {
  error: ApplicationError
  res: Response
  logMeta: CustomLoggerParams['meta']
}) => {
  logger.error({
    message: 'Error occurred whilst handling auth routes',
    meta: logMeta,
    error,
  })

  switch (error.constructor) {
    case InvalidDomainError:
      return res.status(StatusCodes.UNAUTHORIZED).send(error.message)
    case DatabaseError:
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message)
    default:
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Something went wrong. Please try again.')
  }
}

/**
 * Handler for GET /auth/checkuser endpoint.
 * @returns 500 when there was an error validating body.email
 * @returns 401 when domain of body.email is invalid
 * @returns 200 if domain of body.email is valid
 */
export const handleCheckUser: RequestHandler<
  ParamsDictionary,
  string,
  { email: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body
  const logMeta = {
    action: 'handleCheckUser',
    email,
    ip: getRequestIp(req),
  }

  const agencyResult = await AuthService.validateEmailDomain(email)

  agencyResult
    // Agency exists, return success.
    .map(() => res.sendStatus(StatusCodes.OK))
    .mapErr((error) => handleError({ error, res, logMeta }))
}

/**
 * Handler for /auth/sendotp endpoint.
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during generate OTP, or create/send the email that delivers the OTP to the user's email address
 */
export const handleLoginSendOtp: RequestHandler<
  ParamsDictionary,
  string,
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

  const agencyResult = await AuthService.validateEmailDomain(email)
  // Invalid domain, return early.
  if (agencyResult.isErr()) {
    return handleError({ error: agencyResult.error, res, logMeta })
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
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
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
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        'Error sending OTP. Please try again later and if the problem persists, contact us.',
      )
  }

  // Successfully sent login otp.
  logger.info({
    message: 'Login OTP sent successfully',
    meta: logMeta,
  })

  return res.status(StatusCodes.OK).send(`OTP sent to ${email}!`)
}

/**
 * Precondition: AuthMiddlewares.validateDomain must precede this handler.
 */
export const handleLoginVerifyOtp: RequestHandler = async (
  req: Request<
    ParamsDictionary,
    string | SessionUser,
    { email: string; otp: string }
  >,
  res: ResponseAfter['validateDomain'],
) => {
  // Joi validation ensures existence.
  const { email, otp } = req.body
  // validateDomain middleware will populate agency.
  const { agency } = res.locals

  const logMeta = {
    action: 'handleLoginVerifyOtp',
    email,
    ip: getRequestIp(req),
  }

  const [verifyErr] = await to(AuthService.verifyLoginOtp(otp, email))

  if (verifyErr) {
    logger.warn({
      message:
        verifyErr instanceof ApplicationError
          ? 'Login OTP is invalid'
          : 'Error occurred when trying to validate login OTP',
      meta: logMeta,
      error: verifyErr,
    })

    if (verifyErr instanceof ApplicationError) {
      return res.status(verifyErr.status).send(verifyErr.message)
    }

    // Unknown error, return generic error response.
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        'Failed to validate OTP. Please try again later and if the problem persists, contact us.',
      )
  }

  // OTP is valid, proceed to login user.
  try {
    const user = await UserService.retrieveUser(email, agency)
    // Create user object to return to frontend.
    const userObj = { ...user.toObject(), agency }

    if (!req.session) {
      throw new Error('req.session not found')
    }

    // TODO(#212): Should store only userId in session.
    // Add user info to session.
    req.session.user = userObj as SessionUser
    logger.info({
      message: `Successfully logged in user ${user.email}`,
      meta: logMeta,
    })

    return res.status(StatusCodes.OK).send(userObj)
  } catch (err) {
    logger.error({
      message: 'Error logging in user',
      meta: logMeta,
      error: err,
    })

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        `User signin failed. Please try again later and if the problem persists, submit our Support Form (${LINKS.supportFormLink}).`,
      )
  }
}

export const handleSignout: RequestHandler = async (req, res) => {
  if (isEmpty(req.session)) {
    logger.error({
      message: 'Attempted to sign out without a session',
      meta: {
        action: 'handleSignout',
      },
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
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
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Sign out failed')
    }

    // No error.
    res.clearCookie('connect.sid')
    return res.status(StatusCodes.OK).send('Sign out successful')
  })
}
