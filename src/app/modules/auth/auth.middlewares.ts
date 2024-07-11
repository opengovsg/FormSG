import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { UNAUTHORIZED_USER_MESSAGE } from '../user/user.constant'
import * as UserService from '../user/user.service'

import { UnauthorizedError } from './auth.errors'
import { getUserByApiKey } from './auth.service'
import {
  getUserIdFromSession,
  isCronPaymentAuthValid,
  isUserInSession,
  mapRouteError,
  mapRoutePublicApiError,
} from './auth.utils'

const logger = createLoggerWithLabel(module)

/**
 * Middleware that only allows authenticated users to pass through to the next
 * handler.
 * @returns next if user exists in session
 * @returns 401 if user does not exist in session
 */
export const withUserAuthentication: ControllerHandler = (req, res, next) => {
  if (isUserInSession(req.session)) {
    return next()
  }
  const { errorMessage, statusCode } = mapRouteError(new UnauthorizedError())

  return res.status(statusCode).json({ message: errorMessage })
}

/**
 * Logs all admin actions which change database state (i.e. non-GET requests)
 * @returns next
 */
export const logAdminAction: ControllerHandler<{ formId: string }> = async (
  req,
  res,
  next,
) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const body = req.body
  const method = req.method
  const query = req.query
  const { formId } = req.params

  if (req.method.toLowerCase() !== 'get') {
    logger.info({
      message: 'Admin attempting to make changes',
      meta: {
        action: 'logAdminAction',
        method,
        ...createReqMeta(req),
        sessionUserId,
        formId,
        query,
        body,
      },
    })
  }

  return next()
}

export const validateCheckUserParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
  }),
})

export const validateLoginSendOtpParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
  }),
})

export const validateVerifyOtpParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
    otp: Joi.string()
      .required()
      .regex(/^\d{6}$/)
      .message('Please enter a valid OTP'),
  }),
})

export const withCronPaymentSecretAuthentication: ControllerHandler = (
  req,
  res,
  next,
) => {
  if (isCronPaymentAuthValid(req.headers)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'Request is unauthorized.' })
}

type bearerTokenRegExpMatchArray =
  | null
  | (RegExpMatchArray & {
      groups: {
        token: string
      }
    })

type apiKeyRegExpMatchArray =
  | null
  | (RegExpMatchArray & {
      groups: {
        userId: string
      }
    })

/**
 * Middleware that only allows users with a valid bearer token to pass through to the next handler
 */
export const authenticateApiKey: ControllerHandler = (req, res, next) => {
  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Authorisation header is missing' })
  }
  const bearerMatch = authorizationHeader.match(
    /^Bearer (?<token>\S+)$/,
  ) as bearerTokenRegExpMatchArray
  if (!bearerMatch) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid authorisation header format' })
  }

  // Note: testing the exact token format is not needed
  // The minimum knowledge needed about the format is to extract the userId
  // Other than that, invalid tokens will simply fail hash comparison
  const apiKeyMatch = bearerMatch.groups.token.match(
    /^(\w+)_(v\d+)_(?<userId>[0-9a-f]{24})_([a-z0-9/.+]+=*)$/i,
  ) as apiKeyRegExpMatchArray
  if (!apiKeyMatch) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid API key format' })
  }
  logger.info({
    message: 'User attempting to authenticate using API key',
    meta: {
      action: 'authenticateApiKey',
      userId: apiKeyMatch.groups.userId,
    },
  })
  return getUserByApiKey(apiKeyMatch.groups.userId, bearerMatch.groups.token)
    .map((user) => {
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: 'Invalid API key' })
      }
      req.session.user = { _id: user._id }
      // TODO: update apiToken lastUsedAt in DB for the user
      return next()
    })
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRoutePublicApiError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Middleware that checks if user is a platform user
 */
const isPlatformApiUser: ControllerHandler<
  unknown,
  unknown,
  { userEmail: string }
> = (req, res, next) => {
  const { userEmail } = req.body
  const sessionUserId = getUserIdFromSession(req.session)
  if (!sessionUserId) {
    return res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_USER_MESSAGE)
  }
  return UserService.getPopulatedApiUserById(sessionUserId)
    .map((retrievedUser) => {
      if (!retrievedUser) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json(UNAUTHORIZED_USER_MESSAGE)
      }
      if (!retrievedUser.apiToken?.isPlatform || !userEmail) {
        // Exit this middleware if
        // 1. User is not a platform
        // 2. User is a platform but has no userEmail provided
        return next()
      } else {
        return UserService.findUserByEmail(userEmail)
          .map((emailUser) => {
            if (!emailUser) {
              return res
                .status(StatusCodes.UNPROCESSABLE_ENTITY)
                .json('User not found')
            }
            logger.info({
              message: 'API user is a platform',
              meta: {
                action: 'isPlatformApiUser',
                ...createReqMeta(req),
                reqBody: req.body,
                apiUser: sessionUserId,
                userEmail,
              },
            })
            req.session.user = { _id: emailUser._id }
            return next()
          })
          .mapErr((error) => {
            logger.error({
              message: 'Error occurred whilst retrieving user from userEmail',
              meta: {
                action: 'isPlatformApiUser',
                apiUser: sessionUserId,
                userEmail,
              },
              error,
            })

            const { errorMessage, statusCode } = mapRouteError(error)
            return res.status(statusCode).json({ message: errorMessage })
          })
      }
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred whilst retrieving user',
        meta: {
          action: 'isPlatformApiUser',
          userId: sessionUserId,
        },
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const authenticateApiKeyAndPlatform = [
  authenticateApiKey,
  isPlatformApiUser,
] as ControllerHandler[]
