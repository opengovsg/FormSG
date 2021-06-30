import dedent from 'dedent-js'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import {
  ApplicationError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../../modules/core/core.errors'
import { ErrorResponseData } from '../../modules/core/core.types'
import { FormNotFoundError } from '../../modules/form/form.errors'

const logger = createLoggerWithLabel(module)

export const renderFormDeactivatedSms = (formTitle: string): string => dedent`
  Due to responses bouncing from all recipient inboxes, your form "${formTitle}" has been automatically deactivated to prevent further response loss.

  Please ensure your recipient email addresses (Settings tab) have the ability to receive emailed responses from us. Invalid email addresses should be deleted, and full inboxes should be cleared.

  If a systemic email issue is affecting email delivery, consider temporarily deactivating your form until email delivery is stable, or switching the form to Storage mode to continue receiving responses.
`

export const renderBouncedSubmissionSms = (formTitle: string): string => dedent`
  A response to your form "${formTitle}" has bounced from all recipient inboxes. Bounced responses cannot be recovered. To prevent more bounces, please ensure recipient email addresses are correct, and clear any full inboxes.
`

export const renderVerificationSms = (
  otp: string,
  appHost: string,
): string => dedent`Use the OTP ${otp} to submit on ${appHost}.

  Never share your OTP with anyone else. If you did not request this OTP, you can safely ignore this SMS.`

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages for SmsController.
 * @param error The error to retrieve the status codes and error messages
 * @param defaultErrorMessage Any error message to return instead of the default error message, if any
 */
export const mapRouteError = (
  error: ApplicationError,
  defaultErrorMessage = 'Sorry, something went wrong. Please try again.',
): ErrorResponseData => {
  switch (error.constructor) {
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'Could not find the form requested. Please refresh and try again.',
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: defaultErrorMessage,
      }

    case DatabaseValidationError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: defaultErrorMessage,
      }
    case DatabaseConflictError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: defaultErrorMessage,
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: defaultErrorMessage,
      }
    default:
      logger.error({
        message: 'Unknown route error observed in SmsController',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: defaultErrorMessage,
      }
  }
}
