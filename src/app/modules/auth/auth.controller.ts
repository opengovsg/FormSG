import { StatusCodes } from 'http-status-codes'
import { isEmpty } from 'lodash'
import { SendOtpResponseDto } from 'shared/types/user'

import { SUPPORT_FORM_LINK } from '../../../../shared/constants/links'
import { createLoggerWithLabel } from '../../config/logger'
import { ADMIN_LOGIN_SESSION_COOKIE_NAME } from '../../loaders/express/session'
import MailService from '../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as UserService from '../user/user.service'

import {
  validateCheckUserParams,
  validateLoginSendOtpParams,
  validateVerifyOtpParams,
} from './auth.middlewares'
import * as AuthService from './auth.service'
import { SessionUser } from './auth.types'
import { mapRouteError } from './auth.utils'

const logger = createLoggerWithLabel(module)

export const _handleCheckUser: ControllerHandler<
  unknown,
  string,
  { email: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body

  return AuthService.validateEmailDomain(email)
    .map(() => res.sendStatus(StatusCodes.OK))
    .mapErr((error) => {
      logger.error({
        message: 'Domain validation error',
        meta: {
          action: 'handleCheckUser',
          ...createReqMeta(req),
          email,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json(errorMessage)
    })
}

/**
 * Handler for GET /api/v3/auth/email/validate endpoint.
 * @returns 500 when there was an error validating body.email
 * @returns 401 when domain of body.email is invalid
 * @returns 200 if domain of body.email is valid
 */
export const handleCheckUser = [
  validateCheckUserParams,
  _handleCheckUser,
] as ControllerHandler[]

export const _handleLoginSendOtp: ControllerHandler<
  unknown,
  { message: string } | SendOtpResponseDto,
  { email: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body
  const requestIp = getRequestIp(req)
  const logMeta = {
    action: 'handleLoginSendOtp',
    email,
    ...createReqMeta(req),
  }

  // Step 1: Validate email domain.
  const loginOtpResult = await AuthService.validateEmailDomain(email).andThen(
    // Step 2: Create login OTP.
    () => AuthService.createLoginOtp(email),
  )
  // Step 3a: Successfully created login otp.
  if (loginOtpResult.isOk()) {
    const { otp, otpPrefix } = loginOtpResult.value
    return (
      // Step 4: Send login OTP to email address.
      MailService.sendLoginOtp({
        recipient: email,
        otpPrefix,
        otp,
        ipAddress: requestIp,
      })
        // Step 5a: Successfully sent login otp.
        .map(() => {
          logger.info({
            message: 'Login OTP sent successfully',
            meta: logMeta,
          })
          return res
            .status(StatusCodes.OK)
            .json({ message: `OTP sent to ${email}`, otpPrefix })
        })
        // Step 5b: Error occurred whilst sending otp.
        .mapErr((error) => {
          logger.error({
            message: 'Error sending login OTP',
            meta: logMeta,
            error,
          })
          const { errorMessage, statusCode } = mapRouteError(
            error,
            /* coreErrorMessage=*/ 'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
          )
          return res.status(statusCode).json({ message: errorMessage })
        })
    )
  } else {
    // Step 3b: Error occurred whilst creating otp.
    const error = loginOtpResult.error
    logger.error({
      message: 'Error creating login OTP',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(
      error,
      /* coreErrorMessage=*/ 'Failed to create login OTP. Please try again later and if the problem persists, contact us.',
    )
    return res.status(statusCode).json({ message: errorMessage })
  }
}

/**
 * Handler for POST /api/v3/auth/otp/generate endpoint.
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during generate OTP, or create/send the email that delivers the OTP to the user's email address
 */
export const handleLoginSendOtp = [
  validateLoginSendOtpParams,
  _handleLoginSendOtp,
] as ControllerHandler[]

export const _handleLoginVerifyOtp: ControllerHandler<
  unknown,
  string | SessionUser,
  { email: string; otp: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email, otp } = req.body

  const logMeta = {
    action: 'handleLoginVerifyOtp',
    email,
    ...createReqMeta(req),
  }
  const coreErrorMessage = `Failed to process OTP. Please try again later and if the problem persists, submit our Support Form (${SUPPORT_FORM_LINK}).`

  const validateResult = await AuthService.validateEmailDomain(email)
  if (validateResult.isErr()) {
    const { error } = validateResult
    logger.error({
      message: 'Domain validation error',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json(errorMessage)
  }

  // Since there is no error, agency is retrieved from validation.
  const agency = validateResult.value

  // Step 1: Verify login OTP.
  return (
    AuthService.verifyLoginOtp(otp, email)
      // Step 2: OTP is valid, retrieve associated user.
      .andThen(() => UserService.retrieveUser(email, agency._id))
      // Step 3a: Set session and return user in response.
      .map((user) => {
        if (!req.session) {
          logger.error({
            message: 'Error logging in user; req.session is undefined',
            meta: logMeta,
          })

          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(coreErrorMessage)
        }

        // Add user info to session.
        const { _id } = user.toObject() as SessionUser
        req.session.user = { _id }
        logger.info({
          message: `Successfully logged in user ${user._id}`,
          meta: logMeta,
        })

        return res.status(StatusCodes.OK).json(user)
      })
      // Step 3b: Error occured in one of the steps.
      .mapErr((error) => {
        logger.warn({
          message: 'Error occurred when trying to validate login OTP',
          meta: logMeta,
          error,
        })

        const { errorMessage, statusCode } = mapRouteError(
          error,
          coreErrorMessage,
        )
        return res.status(statusCode).json(errorMessage)
      })
  )
}

/**
 * Handler for POST /api/v3/auth/otp/verify endpoint.
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
export const handleLoginVerifyOtp = [
  validateVerifyOtpParams,
  _handleLoginVerifyOtp,
] as ControllerHandler[]

/**
 * Handler for POST /api/v3/auth/logout endpoint.
 * @returns 200 when user has successfully logged out, with session cookie cleared
 * @returns 400 when there is no session to destroy
 * @returns 500 when error occurred while destroying the session
 */
export const handleSignout: ControllerHandler = async (req, res) => {
  if (!req.session || isEmpty(req.session)) {
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
        .json({ message: 'Sign out failed' })
    }

    // No error.
    res.clearCookie(ADMIN_LOGIN_SESSION_COOKIE_NAME)
    return res.status(StatusCodes.OK).json({ message: 'Sign out successful' })
  })
}
