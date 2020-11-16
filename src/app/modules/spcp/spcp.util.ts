import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { MapRouteError } from '../../../types'
import { MissingFeatureError } from '../core/core.errors'

import { CreateRedirectUrlError } from './spcp.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sorry, something went wrong. Please try again.',
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
