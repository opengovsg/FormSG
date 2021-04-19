import { celebrate, Joi, Segments } from 'celebrate'
import { RequestHandler } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { isEmpty } from 'lodash'
import { err } from 'neverthrow'

import { AuthType } from 'src/types'
import { ErrorDto } from 'src/types/api'

import { LINKS } from '../../../shared/constants'
import { createLoggerWithLabel } from '../../config/logger'
import MailService from '../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../utils/request'
import * as FormService from '../form/form.service'
import { MyInfoFactory } from '../myinfo/myinfo.factory'
import { validateMyInfoForm } from '../myinfo/myinfo.util'
import { CreateRedirectUrlError } from '../spcp/spcp.errors'
import { SpcpFactory } from '../spcp/spcp.factory'
import { validateSpcpForm } from '../spcp/spcp.util'
import * as UserService from '../user/user.service'

import * as AuthService from './auth.service'
import { SessionUser } from './auth.types'
import { mapRedirectUrlError, mapRouteError } from './auth.utils'

const logger = createLoggerWithLabel(module)

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
 * Handler for POST /auth/sendotp endpoint.
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during generate OTP, or create/send the email that delivers the OTP to the user's email address
 */
export const handleLoginSendOtp: RequestHandler<
  ParamsDictionary,
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
 *  Handler for POST /auth/verifyotp endpoint.
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
export const handleLoginVerifyOtp: RequestHandler<
  ParamsDictionary,
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
  const coreErrorMessage = `Failed to process OTP. Please try again later and if the problem persists, submit our Support Form (${LINKS.supportFormLink}).`

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

        // TODO(#212): Should store only userId in session.
        // Add user info to session.
        const userObj = user.toObject() as SessionUser
        req.session.user = userObj
        logger.info({
          message: `Successfully logged in user ${user.email}`,
          meta: logMeta,
        })

        return res.status(StatusCodes.OK).json(userObj)
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

export const handleSignout: RequestHandler = async (req, res) => {
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

const validatePersistentLogin = celebrate({
  [Segments.QUERY]: Joi.object({
    isPersistentLogin: Joi.boolean().optional(),
  }),
})

/**
 * NOTE: This is exported only for testing
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param isPersistentLogin whether the client wants to have their login information stored
 */
export const getRedirectLink: RequestHandler<
  { formId: string },
  { redirectURL: string } | ErrorDto,
  unknown,
  Query & { isPersistentLogin: boolean }
> = (req, res) => {
  const { formId } = req.params
  const { isPersistentLogin } = req.query
  const logMeta = {
    action: 'handleRedirect',
    ...createReqMeta(req),
    formId,
  }
  // NOTE: Using retrieveFullForm instead of retrieveForm to ensure authType always exists
  return FormService.retrieveFullFormById(formId)
    .andThen((form) => {
      switch (form.authType) {
        case AuthType.MyInfo:
          return validateMyInfoForm(form).andThen((form) =>
            MyInfoFactory.createRedirectURL({
              formEsrvcId: form.esrvcId,
              formId,
              requestedAttributes: form.getUniqueMyInfoAttrs(),
            }),
          )
        case AuthType.SP:
        case AuthType.CP: {
          // NOTE: Persistent login is only set (and relevant) when the authType is SP.
          // If authType is not SP, assume that it was set erroneously and default it to false
          return validateSpcpForm(form).andThen((form) => {
            const target = `/${formId},${
              // Need to cast to boolean because undefined is allowed as a valid value
              // We are not following corppass's official spec for
              // the target parameter
              form.authType === AuthType.SP ? !!isPersistentLogin : false
            }`
            return SpcpFactory.createRedirectUrl(
              form.authType,
              target,
              form.esrvcId,
            )
          })
        }
        // NOTE: Only MyInfo and SPCP should have redirects as the point of a redirect is
        // to provide auth for users from a third party
        default:
          return err<never, CreateRedirectUrlError>(
            new CreateRedirectUrlError(),
          )
      }
    })
    .map((redirectURL) => {
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRedirectUrlError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for /forms/:formId/auth/redirect
 */
export const handleRedirect = [
  validatePersistentLogin,
  getRedirectLink,
] as RequestHandler[]
