import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import * as SmsErrors from '../../services/sms/sms.errors'
import * as CoreErrors from '../core/core.errors'
import { ErrorResponseData } from '../core/core.types'

import * as UserErrors from './user.errors'

const logger = createLoggerWithLabel(module)
/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError = (
  error: CoreErrors.ApplicationError,
  coreErrorMessage?: string,
): ErrorResponseData => {
  switch (error.constructor) {
    case CoreErrors.MissingFeatureError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sms feature unavailable',
      }
    case UserErrors.InvalidOtpError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: error.message,
      }
    case UserErrors.MissingUserError:
    case SmsErrors.SmsSendError:
    case SmsErrors.InvalidNumberError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case CoreErrors.ApplicationError:
    case CoreErrors.DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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
