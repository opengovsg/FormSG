import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  HASH_EXPIRE_AFTER_SECONDS,
  VERIFIED_FIELDTYPES,
  WAIT_FOR_OTP_SECONDS,
} from '../../../shared/util/verification'
import {
  IFieldSchema,
  IVerificationSchema,
  MapRouteError,
} from '../../../types'
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

/**
 * Evaluates whether a field is verifiable
 * @param field
 */
const isFieldVerifiable = (field: IFieldSchema): boolean => {
  return (
    VERIFIED_FIELDTYPES.includes(field.fieldType) && field.isVerifiable === true
  )
}

/**
 * Gets verifiable fields from form and initializes the values to be stored in a transaction
 * @param form
 */
export const extractTransactionFields = (
  formFields: IFieldSchema[],
): Pick<IFieldSchema, '_id' | 'fieldType'>[] => {
  return formFields.filter(isFieldVerifiable).map(({ _id, fieldType }) => ({
    _id,
    fieldType,
  }))
}

export const getExpiryDate = (
  expireAfterSeconds: number,
  fromDate?: Date,
): Date => {
  const expireAt = fromDate ? new Date(fromDate) : new Date()
  expireAt.setTime(expireAt.getTime() + expireAfterSeconds * 1000)
  return expireAt
}

/**
 * Checks if expireAt is in the past -- ie transaction has expired
 * @param expireAt
 * @returns boolean
 */
export const isTransactionExpired = (
  transaction: IVerificationSchema,
): boolean => {
  const currentDate = new Date()
  return transaction.expireAt < currentDate
}

/**
 * Checks if HASH_EXPIRE_AFTER_SECONDS has elapsed since the field's hash was created - ie hash has expired
 * @param hashCreatedAt
 */
export const isOtpExpired = (hashCreatedAt: Date): boolean => {
  const currentDate = new Date()
  const expireAt = getExpiryDate(HASH_EXPIRE_AFTER_SECONDS, hashCreatedAt)
  return expireAt < currentDate
}

export const isOtpWaitTimeElapsed = (hashCreatedAt: Date | null): boolean => {
  // No hash created yet, so no wait time
  if (!hashCreatedAt) return true

  const expireAtMs = getExpiryDate(
    WAIT_FOR_OTP_SECONDS,
    hashCreatedAt,
  ).getTime()
  const currentMs = Date.now()
  return Math.ceil((expireAtMs - currentMs) / 1000) > 0
}

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
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.NOT_FOUND,
      }
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
