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

import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from './workspace.errors'

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
        errorMessage,
      }
    case DatabaseValidationError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage,
      }
    case DatabaseConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage,
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
        errorMessage,
      }
    case WorkspaceNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage,
      }
    case ForbiddenWorkspaceError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage,
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
