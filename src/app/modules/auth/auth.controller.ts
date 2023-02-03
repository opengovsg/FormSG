import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { isEmpty } from 'lodash'

import { SUPPORT_FORM_LINK } from '../../../../shared/constants/links'
import { createLoggerWithLabel } from '../../config/logger'
import MailService from '../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { GovLoginService } from '../govlogin/govlogin.service'
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

export const handleOauthRedirect: ControllerHandler = (req, res) => {
  return GovLoginService.createRedirectUrl()
    .map((redirectUrl) => {
      logger.info({
        message: 'Redirecting user to govlogin page',
        meta: {
          action: 'handleOauthRedirect',
          redirectUrl,
        },
      })
      return res.json({ redirectUrl })
    })
    .mapErr((error) => {
      logger.error({
        meta: {
          action: 'handleOauthRedirect',
        },
        message: 'Error while creating oauth redirect URL',
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

const _handleOauthCallback: ControllerHandler<
  unknown,
  unknown,
  unknown,
  { code: string; iss: string }
> = (req, res) => {
  const { code } = req.query

  const logMeta = {
    action: '_handleOauthCallback',
    ...createReqMeta(req),
  }

  return GovLoginService.retrieveAccessToken(code)
    .andThen(({ sub: email }) =>
      AuthService.validateEmailDomain(email).andThen((agency) =>
        UserService.retrieveUser(email, agency._id),
      ),
    )
    .map((user) => {
      if (!req.session) {
        logger.error({
          message: 'Error logging in user; req.session is undefined',
          meta: logMeta,
        })

        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Error logging in user; req.session is undefined')
      }

      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }
      logger.info({
        message: `Successfully logged in user ${user._id}`,
        meta: logMeta,
      })

      return res.redirect('/login?oauth=success')
    })
    .mapErr((error) => {
      logger.error({
        meta: {
          action: '_handleOauthCallback',
        },
        message: 'Error while exchanging access token',
        error,
      })

      const redirectUrl = `/login?oauth=error&message=${encodeURIComponent(
        error.message,
      )}`

      return res.redirect(redirectUrl)
    })
}

export const handleOauthCallback = [
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      code: Joi.string().required(),
      iss: Joi.string().uri().required(),
    }),
  }),
  _handleOauthCallback,
] as ControllerHandler[]

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
 * Handler for GET /auth/checkuser endpoint.
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
  { message: string } | string,
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

  return (
    // Step 1: Validate email domain.
    AuthService.validateEmailDomain(email)
      // Step 2: Create login OTP.
      .andThen(() => AuthService.createLoginOtp(email))
      // Step 3: Send login OTP to email address.
      .andThen((otp) =>
        MailService.sendLoginOtp({
          recipient: email,
          otp,
          ipAddress: requestIp,
        }),
      )
      // Step 4a: Successfully sent login otp.
      .map(() => {
        logger.info({
          message: 'Login OTP sent successfully',
          meta: logMeta,
        })

        return res.status(StatusCodes.OK).json(`OTP sent to ${email}`)
      })
      // Step 4b: Error occurred whilst sending otp.
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
}

/**
 * Handler for POST /auth/sendotp endpoint.
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during generate OTP, or create/send the email that delivers the OTP to the user's email address
 */
export const handleLoginSendOtp = [
  validateLoginSendOtpParams,
  _handleLoginSendOtp,
] as ControllerHandler[]

/**
 * Handler for POST /auth/verifyotp endpoint.
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
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

export const handleLoginVerifyOtp = [
  validateVerifyOtpParams,
  _handleLoginVerifyOtp,
] as ControllerHandler[]

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
    res.clearCookie('connect.sid')
    return res.status(StatusCodes.OK).json({ message: 'Sign out successful' })
  })
}
