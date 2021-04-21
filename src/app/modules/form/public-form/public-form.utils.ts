import { getReasonPhrase, StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  ApplicationError,
  DatabaseError,
  MissingFeatureError,
} from '../../core/core.errors'
import { ErrorResponseData } from '../../core/core.types'
import {
  MyInfoAuthTypeError,
  MyInfoNoESrvcIdError,
} from '../../myinfo/myinfo.errors'
import {
  AuthTypeMismatchError,
  CreateRedirectUrlError,
  SpcpAuthTypeError,
  SpcpNoESrvcIdError,
} from '../../spcp/spcp.errors'
import * as FormErrors from '../form.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages for PublicFormController.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError = (
  error: ApplicationError,
  coreErrorMessage?: string,
): ErrorResponseData => {
  switch (error.constructor) {
    case FormErrors.FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case FormErrors.FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage: getReasonPhrase(StatusCodes.GONE),
      }
    case FormErrors.PrivateFormError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case DatabaseError:
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage ?? error.message,
      }
    case MyInfoAuthTypeError:
    case MyInfoNoESrvcIdError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have MyInfo enabled. Please refresh and try again.',
      }
    case SpcpNoESrvcIdError:
    case SpcpAuthTypeError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have Singpass or Corppass enabled. Please refresh and try again.',
      }
    case AuthTypeMismatchError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      }
    default:
      logger.error({
        message: 'Unknown route error observed in PublicFormController',
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
