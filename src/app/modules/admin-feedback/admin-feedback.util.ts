import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import {
  IncorrectUserIdToAdminFeedbackError,
  MissingAdminFeedbackError,
} from './admin-feedback.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (
  error: ApplicationError,
  coreErrorMessage = 'Sorry, something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case IncorrectUserIdToAdminFeedbackError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage: error.message,
      }
    case MissingAdminFeedbackError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }

    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage ?? error.message,
      }
    default:
      logger.error({
        message: 'mapRouteError called with unknown error type',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
  }
}
