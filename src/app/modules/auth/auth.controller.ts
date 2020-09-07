import { RequestHandler, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import { StatusCodes } from 'http-status-codes'
import { isEmpty } from 'lodash'

import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import MailService from '../../services/mail.service'
import { getRequestIp } from '../../utils/request'
import * as CoreError from '../core/core.errors'
import * as UserService from '../user/user.service'

import * as AuthError from './auth.errors'
import * as AuthService from './auth.service'
import { SessionUser } from './auth.types'

const logger = createLoggerWithLabel(module)

const handleError = ({
  error,
  res,
  logMeta,
}: {
  error: CoreError.ApplicationError
  res: Response
  logMeta: CustomLoggerParams['meta']
}) => {
  logger.error({
    message: 'Error occurred whilst handling auth routes',
    meta: logMeta,
    error,
  })

  switch (error.constructor) {
    case AuthError.InvalidDomainError:
      return res.status(StatusCodes.UNAUTHORIZED).send(error.message)
    case AuthError.InvalidOtpError:
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.message)
    case CoreError.DatabaseError:
    case CoreError.ApplicationError:
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
  unknown,
  { email: string }
> = (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body
  const logMeta = {
    action: 'handleCheckUser',
    email,
    ip: getRequestIp(req),
  }

  return pipe(
    AuthService.validateEmailDomain(email),
    // Agency exists, return success.
    TE.map(() => res.sendStatus(StatusCodes.OK)),
    TE.mapLeft((error) => handleError({ error, res, logMeta })),
  )()
}

/**
 * Handler for /auth/sendotp endpoint.
 * @return 200 when OTP has been been successfully sent
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during generate OTP, or create/send the email that delivers the OTP to the user's email address
 */
export const handleLoginSendOtp: RequestHandler<
  ParamsDictionary,
  unknown,
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

  return pipe(
    // Step 1: Validate email domain.
    AuthService.validateEmailDomain(email),
    // Step 2: Create login OTP.
    TE.chain(() => AuthService.createLoginOtp(email)),
    // Step 3: Send login OTP to email.
    TE.chain((otp) =>
      MailService.sendLoginOtp({
        ipAddress: requestIp,
        otp,
        recipient: email,
      }),
    ),
    // Step 4a: Login OTP sent successfully.
    TE.map(() => res.status(StatusCodes.OK).send(`OTP sent to ${email}!`)),
    // Step 5b: Handle and return error responses.
    TE.mapLeft((error) => handleError({ error, res, logMeta })),
  )()
}

/**
 * Handler for /auth/verifyotp endpoint.
 * @headers 200.set-cookie contains the session cookie upon login
 * @returns 200 when user has successfully logged in, with session cookie set
 * @returns 401 when the email domain is invalid
 * @returns 422 when the OTP is invalid
 * @returns 500 when error occurred whilst verifying the OTP
 */
export const handleLoginVerifyOtp: RequestHandler<
  ParamsDictionary,
  unknown,
  { email: string; otp: string }
> = (req, res) => {
  // Joi validation ensures existence.
  const { email, otp } = req.body
  const logMeta = {
    action: 'handleLoginVerifyOtp',
    email,
    ip: getRequestIp(req),
  }

  return pipe(
    // Step 1: Validate email domain.
    AuthService.validateEmailDomain(email),
    TE.chain((agency) =>
      pipe(
        // Step 2: Verify login otp against email.
        AuthService.verifyLoginOtp(otp, email),
        // Step 3: Retrieve user via agency and email
        TE.chain(() => UserService.retrieveUser(email, agency)),
        // Step 4: Set user in session and return populated user object.
        TE.chain((user) => {
          if (!req.session) {
            logger.error({
              message: 'checkSession: req.session not found',
              meta: logMeta,
            })
            return TE.left(new CoreError.ApplicationError())
          }
          // Create user object to return to frontend.
          const userObj: SessionUser = { ...user.toObject(), agency }
          return TE.right(userObj)
        }),
      ),
    ),
    // Step 5a: Return success response with logged in user.
    TE.map((user) => {
      // TODO(#212): Should store only userId in session.
      // Add user info to session.
      req.session.user = user
      logger.info({
        message: `Successfully logged in user ${user.email}`,
        meta: logMeta,
      })

      return res.status(StatusCodes.OK).send(user)
    }),
    // Step 5b: Handle and return error responses.
    TE.mapLeft((error) => handleError({ error, res, logMeta })),
  )()
}

/**
 * Handler for /auth/signout endpoint.
 * @headers 200.clear-cookie clears cookie upon signout
 * @returns 200 when user has signed out successfully
 * @returns 400 when the request does not contain a session
 * @returns 500 when the session fails to be destroyed
 */
export const handleSignout: RequestHandler = (req, res) => {
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
