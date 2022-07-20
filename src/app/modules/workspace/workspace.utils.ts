import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import {
  ApplicationError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../core/core.errors'
import { ErrorResponseData } from '../core/core.types'

import { WorkspaceNotFoundError } from './workspace.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError = (
  error: ApplicationError,
  coreErrorMessage?: string,
): ErrorResponseData => {
  const errorMessage = coreErrorMessage ?? error.message

  switch (error.constructor) {
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: errorMessage,
      }
    case DatabaseValidationError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: errorMessage,
      }
    case DatabaseConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage: errorMessage,
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
        errorMessage: errorMessage,
      }
    case WorkspaceNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: coreErrorMessage ?? error.message,
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
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}
