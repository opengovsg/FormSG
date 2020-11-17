import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { MapRouteError } from '../../../types'
import { MissingFeatureError } from '../core/core.errors'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
} from './spcp.errors'

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
