import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, MapRouteError } from '../../../types'
import { MissingFeatureError } from '../core/core.errors'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
  VerifyJwtError,
} from './spcp.errors'
import { JwtName, JwtPayload, SpcpCookies } from './spcp.types'

const logger = createLoggerWithLabel(module)

export const getSubstringBetween = (
  text: string,
  markerStart: string,
  markerEnd: string,
): string | null => {
  const start = text.indexOf(markerStart)
  if (start === -1) {
    return null
  } else {
    const end = text.indexOf(markerEnd, start)
    return end === -1 ? null : text.substring(start + markerStart.length, end)
  }
}

export const verifyJwtPromise = (
  authClient: SPCPAuthClient,
  jwt: string,
): Promise<JwtPayload> => {
  return new Promise<JwtPayload>((resolve, reject) => {
    authClient.verifyJWT<JwtPayload>(jwt, (error: Error, data: JwtPayload) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })
}

export const extractJwt = (
  cookies: SpcpCookies,
  authType: AuthType,
): string | undefined => {
  switch (authType) {
    case AuthType.SP:
      return cookies[JwtName.SP]
    case AuthType.CP:
      return cookies[JwtName.CP]
    default:
      return undefined
  }
}

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sorry, something went wrong. Please try again.',
      }
    case FetchLoginPageError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage: 'Failed to contact SingPass. Please try again.',
      }
    case LoginPageValidationError:
      return {
        statusCode: StatusCodes.BAD_GATEWAY,
        errorMessage: 'Error while contacting SingPass. Please try again.',
      }
    case VerifyJwtError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'User is not SPCP authenticated',
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sorry, something went wrong. Please try again.',
      }
  }
}
