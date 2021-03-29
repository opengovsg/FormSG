import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { WAIT_FOR_OTP_SECONDS } from '../../../shared/util/verification'
import { MapRouteError } from '../../../types'
import { MailSendError } from '../../services/mail/mail.errors'
import { InvalidNumberError, SmsSendError } from '../../services/sms/sms.errors'
import { HashingError } from '../../utils/hash'
import {
  DatabaseError,
  MalformedParametersError,
  MissingFeatureError,
} from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'

import {
  FieldNotFoundInTransactionError,
  MissingHashDataError,
  NonVerifiedFieldTypeError,
  OtpExpiredError,
  OtpRetryExceededError,
  TransactionExpiredError,
  TransactionNotFoundError,
  WaitForOtpError,
  WrongOtpError,
} from './verification.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (
  error,
  coreErrorMsg = 'Sorry, something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case TransactionExpiredError:
      return {
        errorMessage: 'Your session has expired, please refresh and try again.',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case OtpExpiredError:
      return {
        errorMessage: 'Your OTP has expired, please request for a new one.',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case OtpRetryExceededError:
      return {
        errorMessage:
          'You have entered too many invalid OTPs. Please request for a new OTP and try again.',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case WrongOtpError:
      return {
        errorMessage: 'Wrong OTP.',
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      }
    case WaitForOtpError:
      return {
        errorMessage: `You must wait for ${WAIT_FOR_OTP_SECONDS} seconds between each OTP request.`,
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case InvalidNumberError:
      return {
        errorMessage:
          'This phone number does not seem to be valid. Please try again with a valid phone number.',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case MalformedParametersError:
    case SmsSendError:
    case MailSendError:
    case NonVerifiedFieldTypeError:
    case MissingHashDataError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case FieldNotFoundInTransactionError:
    case TransactionNotFoundError:
    case FormNotFoundError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.NOT_FOUND,
      }
    case HashingError:
    case DatabaseError:
    case MissingFeatureError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      }
    default:
      logger.warn({
        message: 'Unknown error type encountered',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      }
  }
}
