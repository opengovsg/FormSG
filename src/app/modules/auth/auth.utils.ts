import { AuthedSessionData, SessionData } from 'express-session'
import { IncomingHttpHeaders } from 'http'
import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from '../../../types/routing'
import { cronPaymentConfig } from '../../config/features/payment-cron.config'
import { createLoggerWithLabel } from '../../config/logger'
import * as MailErrors from '../../services/mail/mail.errors'
import { HashingError } from '../../utils/hash'
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
    case HashingError:
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
  session?: SessionData,
): session is AuthedSessionData => {
  return !!session?.user?._id
}

export const getUserIdFromSession = (
  session?: SessionData,
): string | undefined => {
  return session?.user?._id as string | undefined
}

export const isCronPaymentAuthValid = (header: IncomingHttpHeaders) => {
  return header['x-cron-payment-secret'] === cronPaymentConfig.apiSecret
}
