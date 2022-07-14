import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError, DatabaseError } from '../core/core.errors'
import * as FormErrors from '../form/form.errors'

import {
  DuplicateFeedbackSubmissionError,
  InvalidSubmissionIdError,
} from './feedback.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (
  error: ApplicationError,
  coreErrorMessage = 'Sorry, something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case FormErrors.FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'This form no longer exists, please contact the agency that gave you the form link if you wish to provide feedback.',
      }
    case FormErrors.FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage:
          'This form has been deleted, so feedback submissions are no longer accepted',
      }
    case FormErrors.PrivateFormError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'This form has been made private, so feedback submissions are no longer accepted',
      }
    case InvalidSubmissionIdError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case DuplicateFeedbackSubmissionError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
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
