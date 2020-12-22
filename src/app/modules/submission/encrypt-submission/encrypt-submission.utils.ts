import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../../config/logger'
import { MapRouteError } from '../../../../types/routing'
import { DatabaseError, MalformedParametersError } from '../../core/core.errors'
import { CreatePresignedUrlError } from '../../form/admin-form/admin-form.errors'
import {
  ConflictError,
  InvalidEncodingError,
  ProcessingError,
  SubmissionNotFoundError,
  ValidateFieldError,
} from '../submission.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 */
export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MalformedParametersError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case SubmissionNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case InvalidEncodingError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Invalid data was found. Please check your responses and submit again.',
      }
    case ValidateFieldError:
    case ProcessingError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
      }
    case ConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage:
          'The form has been updated. Please refresh and submit again.',
      }
    case CreatePresignedUrlError:
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
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
