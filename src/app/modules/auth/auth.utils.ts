import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { MapRouteError } from '../../../types/routing'
import * as MailErrors from '../../services/mail/mail.errors'
import * as CoreErrors from '../core/core.errors'

import * as AuthErrors from './auth.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError: MapRouteError = (error, coreErrorMessage) => {
  switch (error.constructor) {
    case AuthErrors.InvalidDomainError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: error.message,
      }
    case AuthErrors.InvalidOtpError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case MailErrors.MailSendError:
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

export const isUserInSession = (
  session?: Express.Session,
): session is Express.AuthedSession => {
  return !!session?.user?._id
}

// TODO(#212): Save userId instead of entire user collection in session.
export const getUserIdFromSession = (
  session?: Express.Session,
): string | undefined => {
  return session?.user?._id as string | undefined
}
