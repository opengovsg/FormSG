import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'

import {
  HASH_EXPIRE_AFTER_SECONDS,
  MAX_OTP_REQUESTS,
  VERIFIED_FIELDTYPES,
  WAIT_FOR_OTP_SECONDS,
  WAIT_FOR_OTP_TOLERANCE_SECONDS,
} from '../../../../shared/utils/verification'
import {
  IFieldSchema,
  IVerificationFieldSchema,
  IVerificationSchema,
  MapRouteError,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import {
  OtpRequestCountExceededError,
  OtpRequestError,
  SmsLimitExceededError,
} from '../../modules/verification/verification.errors'
import { MailSendError } from '../../services/mail/mail.errors'
import {
  InvalidNumberError,
  SmsSendError,
} from '../../services/postman-sms/postman-sms.errors'
import { HashingError } from '../../utils/hash'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  MalformedParametersError,
} from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import {
  MyInfoCookieStateError,
  MyInfoInvalidLoginCookieError,
  MyInfoMissingLoginCookieError,
} from '../myinfo/myinfo.errors'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from '../sgid/sgid.errors'
import {
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../spcp/spcp.errors'

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
 * @param formFields
 */
export const extractTransactionFields = (
  formFields: IFieldSchema[],
): Pick<IFieldSchema, '_id' | 'fieldType'>[] => {
  return formFields.filter(isFieldVerifiable).map(({ _id, fieldType }) => ({
    _id,
    fieldType,
  }))
}

/**
 * Computes an expiry date a given number of seconds after the original date.
 * @param expireAfterSeconds Seconds to add to date
 * @param fromDate Original date. Defaults to current date.
 * @returns Date of expiry
 */
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
 * @param transaction the transaction document to
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

/**
 * Computes whether the minimum waiting time for an OTP has elapsed. If this
 * returns true, then a new OTP can be requested.
 * @param hashCreatedAt When field hash was created
 * @returns True if wait time has elapsed and hence a new OTP can be requested,
 * false  otherwise
 */
export const isOtpWaitTimeElapsed = (hashCreatedAt: Date | null): boolean => {
  // No hash created yet, so no wait time
  if (!hashCreatedAt) return true

  // Loosen validation by WAIT_FOR_OTP_TOLERANCE_SECONDS. This is because of
  // potential clock drift between servers, where valid requests may be rejected
  // because servers are a few seconds in front/behind each other.
  const elapseAt = getExpiryDate(
    /*expireAfter=*/ WAIT_FOR_OTP_SECONDS - WAIT_FOR_OTP_TOLERANCE_SECONDS,
    /*fromDate=*/ hashCreatedAt,
  )
  const currentDate = new Date()
  return currentDate > elapseAt
}

/**
 * Computes whether the number of OTPs requested has exceeded the maximum allowed.
 * @param otpRequests Number of OTPs already requested
 * @returns true if the number of OTPs has exceeded the maximum allowed
 */
export const isOtpRequestCountExceeded = (otpRequests: number): boolean => {
  // Use >= because otpRequests is the number of OTPs previously requested
  return otpRequests >= MAX_OTP_REQUESTS
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
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      }
    case OtpRetryExceededError:
      return {
        errorMessage:
          'You have entered too many invalid OTPs. Please request for a new OTP and try again.',
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      }
    case WrongOtpError:
      return {
        errorMessage: 'Wrong OTP.',
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      }
    case WaitForOtpError:
      return {
        errorMessage: `You must wait for ${WAIT_FOR_OTP_SECONDS} seconds between each OTP request.`,
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      }
    case OtpRequestCountExceededError:
      return {
        errorMessage: `You have requested too many OTPs. Please refresh and try again.`,
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
    case NonVerifiedFieldTypeError:
    case MissingHashDataError:
    case DatabaseValidationError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case MissingJwtError:
    case InvalidJwtError:
    case VerifyJwtError:
    case SgidVerifyJwtError:
    case SgidInvalidJwtError:
    case SgidMissingJwtError:
    case MyInfoMissingLoginCookieError:
    case MyInfoInvalidLoginCookieError:
    case MyInfoCookieStateError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case MailSendError:
      return {
        errorMessage:
          'Sorry, we were unable to send the email out at this time. Please ensure that the email entered is correct. If this problem persists, please refresh and try again later.',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
        // Message is injected internally
        errorMessage: error.message,
      }
    case DatabaseConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        // Message is injected internally
        errorMessage: error.message,
      }
    case FieldNotFoundInTransactionError:
    case TransactionNotFoundError:
    case FormNotFoundError:
      return {
        errorMessage: coreErrorMsg,
        statusCode: StatusCodes.NOT_FOUND,
      }
    case SmsLimitExceededError:
    case OtpRequestError:
      return {
        errorMessage:
          'Sorry, this form is outdated. Please refresh your browser to get the latest version of the form',
        statusCode: StatusCodes.BAD_REQUEST,
      }
    case HashingError:
    case DatabaseError:
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

/**
 * Extracts an individual field's data from a transaction document.
 * @param transaction Transaction document
 * @param fieldId ID of field to find
 * @returns ok(field) when field exists
 * @returns err(FieldNotFoundInTransactionError) when field does not exist
 */
export const getFieldFromTransaction = (
  transaction: IVerificationSchema,
  isPayment: boolean,
  fieldId: string,
): Result<IVerificationFieldSchema, FieldNotFoundInTransactionError> => {
  const field = transaction.getField(isPayment, fieldId)
  if (!field) {
    logger.warn({
      message: 'Field ID not found for transaction',
      meta: {
        action: 'getFieldFromTransaction',
        transactionId: transaction._id,
        fieldId,
        formId: transaction.formId,
      },
    })
    return err(new FieldNotFoundInTransactionError())
  }
  return ok(field)
}
