import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { NUM_OTP_RETRIES } from '../../../shared/util/verification'
import {
  BasicField,
  IVerificationFieldSchema,
  IVerificationSchema,
  PublicTransaction,
} from '../../../types'
import { MailSendError } from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { InvalidNumberError, SmsSendError } from '../../services/sms/sms.errors'
import { SmsFactory } from '../../services/sms/sms.factory'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { compareHash, HashingError } from '../../utils/hash'
import {
  DatabaseError,
  MalformedParametersError,
  PossibleDatabaseError,
} from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import * as FormService from '../form/form.service'

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
import getVerificationModel from './verification.model'
import { SendOtpParams } from './verification.types'
import {
  isOtpExpired,
  isOtpWaitTimeElapsed,
  isTransactionExpired,
} from './verification.util'

const logger = createLoggerWithLabel(module)

const VerificationModel = getVerificationModel(mongoose)

/**
 *  Creates a transaction for a form that has verifiable fields
 * @param formId
 * @returns ok(created transaction or null) if form has no verifiable fields.
 * @returns err(FormNotFoundError) when form does not exist
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
export const createTransaction = (
  formId: string,
): ResultAsync<
  IVerificationSchema | null,
  FormNotFoundError | PossibleDatabaseError
> => {
  const logMeta = {
    action: 'createTransaction',
    formId,
  }
  return FormService.retrieveFormById(formId).andThen((form) =>
    ResultAsync.fromPromise(
      VerificationModel.createTransactionFromForm(form),
      (error) => {
        logger.error({
          message: 'Error while creating transaction',
          meta: logMeta,
          error,
        })
        return transformMongoError(error)
      },
    ),
  )
}

/**
 *  Retrieves a transaction's metadata by id
 * @param transactionId
 * @returns ok(transaction metadata)
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
export const getTransactionMetadata = (
  transactionId: string,
): ResultAsync<
  PublicTransaction,
  TransactionNotFoundError | PossibleDatabaseError
> => {
  const logMeta = {
    action: 'getTransactionMetadata',
    transactionId,
  }
  return ResultAsync.fromPromise(
    VerificationModel.getPublicViewById(transactionId),
    (error) => {
      logger.error({
        message: 'Error while retrieving transaction metadata',
        meta: logMeta,
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((transaction) => {
    if (!transaction) {
      logger.error({
        message: 'Transaction ID does not exist',
        meta: logMeta,
      })
      return errAsync(new TransactionNotFoundError())
    }
    return okAsync(transaction)
  })
}

/**
 * Retrieves an entire transaction and validates that it is not expired
 * @param transactionId
 * @returns ok(transaction)
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(TransactionExpiredError) when transaction is expired
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
const getValidTransaction = (
  transactionId: string,
): ResultAsync<
  IVerificationSchema,
  TransactionNotFoundError | PossibleDatabaseError | TransactionExpiredError
> => {
  const logMeta = {
    action: 'getValidTransaction',
    transactionId,
  }
  return ResultAsync.fromPromise(
    VerificationModel.findById(transactionId).exec(),
    (error) => {
      logger.error({
        message: 'Error while retrieving transaction',
        meta: logMeta,
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((transaction) => {
    if (!transaction) {
      logger.error({
        message: 'Transaction ID does not exist',
        meta: logMeta,
      })
      return errAsync(new TransactionNotFoundError())
    }
    if (isTransactionExpired(transaction)) {
      logger.warn({
        message: 'Transaction has expired',
        meta: {
          ...logMeta,
          formId: transaction.formId,
        },
      })
      return errAsync(new TransactionExpiredError())
    }
    return okAsync(transaction)
  })
}

/**
 * Extracts an individual field's data from a transaction document.
 * @param transaction Transaction document
 * @param fieldId ID of field to find
 * @returns ok(field) when field exists
 * @returns err(FieldNotFoundInTransactionError) when field does not exist
 */
const getFieldFromTransaction = (
  transaction: IVerificationSchema,
  fieldId: string,
): Result<IVerificationFieldSchema, FieldNotFoundInTransactionError> => {
  const field = transaction.getField(fieldId)
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

/**
 * Sets signedData, hashedOtp, hashCreatedAt to null for that field in that transaction
 * @param transactionId
 * @param fieldId
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(TransactionExpiredError) when transaction is expired
 * @returns err(FieldNotFoundInTransactionError) when field does not exist
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
export const resetFieldForTransaction = (
  transactionId: string,
  fieldId: string,
): ResultAsync<
  IVerificationSchema,
  | TransactionNotFoundError
  | TransactionExpiredError
  | FieldNotFoundInTransactionError
  | PossibleDatabaseError
> => {
  // Ensure that field ID exists first
  return getValidTransaction(transactionId).andThen((transaction) => {
    const logMeta = {
      action: 'resetFieldForTransaction',
      transactionId,
      fieldId,
      formId: transaction.formId,
    }
    return (
      getFieldFromTransaction(transaction, fieldId)
        // Apply atomic update
        .asyncAndThen(() =>
          ResultAsync.fromPromise(
            VerificationModel.resetField(transactionId, fieldId),
            (error) => {
              logger.error({
                message: 'Error while resetting field data in transaction',
                meta: logMeta,
                error,
              })
              return transformMongoError(error)
            },
          ),
        )
        .andThen((updatedTransaction) => {
          // Transaction was deleted before update could be applied
          if (!updatedTransaction) {
            logger.error({
              message: 'Transaction with given ID does not exist',
              meta: logMeta,
            })
            return errAsync(new TransactionNotFoundError())
          }
          return okAsync(updatedTransaction)
        })
    )
  })
}

/**
 * Sends OTP and updates database record for the given transaction, fieldId, and answer
 * @param transactionId
 * @param fieldId
 * @param recipient Phone number for verified mobile field, or email address for verified email
 * @param otp Input OTP to be sent
 * @param hashedOtp Hash of input OTP to be saved
 * @returns ok(updated transaction document)
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(TransactionExpiredError) when transaction is expired
 * @returns err(FieldNotFoundInTransactionError) when field does not exist
 * @returns err(WaitForOtpError) when waiting time for new OTP has not elapsed
 * @returns err(MalformedParametersError) when form data to send SMS OTP cannot be retrieved
 * @returns err(SmsSendError) when attempt to send OTP SMS fails
 * @returns err(InvalidNumberError) when SMS recipient is invalid
 * @returns err(MailSendError) when attempt to send OTP email fails
 * @returns err(NonVerifiedFieldTypeError) when field's fieldType is not verified
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
export const sendNewOtp = ({
  transactionId,
  fieldId,
  recipient,
  otp,
  hashedOtp,
}: SendOtpParams): ResultAsync<
  IVerificationSchema,
  | TransactionNotFoundError
  | PossibleDatabaseError
  | FieldNotFoundInTransactionError
  | TransactionExpiredError
  | WaitForOtpError
  | MalformedParametersError
  | SmsSendError
  | InvalidNumberError
  | MailSendError
  | NonVerifiedFieldTypeError
> => {
  return getValidTransaction(transactionId).andThen((transaction) => {
    const logMeta = {
      action: 'sendNewOtp',
      transactionId,
      fieldId,
      formId: transaction.formId,
    }
    return getFieldFromTransaction(transaction, fieldId)
      .asyncAndThen((field) => {
        if (!isOtpWaitTimeElapsed(field.hashCreatedAt)) {
          logger.warn({
            message: 'OTP requested before waiting time elapsed',
            meta: logMeta,
          })
          return errAsync(new WaitForOtpError())
        }

        return sendOtpForField(transaction.formId, field, recipient, otp)
      })
      .andThen(() => {
        const signedData = formsgSdk.verification.generateSignature({
          transactionId,
          formId: transaction.formId,
          fieldId,
          answer: recipient,
        })
        return ResultAsync.fromPromise(
          VerificationModel.updateHashForField({
            fieldId,
            hashedOtp,
            signedData,
            transactionId,
          }),
          (error) => {
            logger.error({
              message:
                'Error while updating transaction data after sending OTP',
              meta: logMeta,
              error,
            })
            return transformMongoError(error)
          },
        )
      })
      .andThen((newTransaction) => {
        // Transaction deleted before update could be applied
        if (!newTransaction) {
          logger.warn({
            message: 'Transaction with given ID not found',
            meta: logMeta,
          })
          return errAsync(new TransactionNotFoundError())
        }
        return okAsync(newTransaction)
      })
  })
}

/**
 * Compares the given otp. If correct, returns signedData, else returns an error
 * @param transactionId
 * @param fieldId
 * @param inputOtp
 * @returns ok(signedData of field) when OTP is correct
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(TransactionExpiredError) when transaction is expired
 * @returns err(FieldNotFoundInTransactionError) when field does not exist
 * @returns err(MissingHashDataError) when field exists but data on hash is missing
 * @returns err(OtpExpiredError) when OTP has expired
 * @returns err(OtpRetryExceededError) when OTP has been retried too many times
 * @returns err(WrongOtpError) when OTP is wrong
 * @returns err(HashingError) when error occurs while hashing input OTP for comparison
 * @returns err(PossibleDatabaseError) when database read/write errors
 */
export const verifyOtp = (
  transactionId: string,
  fieldId: string,
  inputOtp: string,
): ResultAsync<
  string,
  | TransactionNotFoundError
  | PossibleDatabaseError
  | FieldNotFoundInTransactionError
  | TransactionExpiredError
  | MissingHashDataError
  | OtpExpiredError
  | OtpRetryExceededError
  | WrongOtpError
  | HashingError
> => {
  return getValidTransaction(transactionId).andThen((transaction) =>
    getFieldFromTransaction(transaction, fieldId).asyncAndThen((field) => {
      const logMeta = {
        action: 'verifyOtp',
        transactionId,
        fieldId,
        formId: transaction.formId,
      }
      const { hashedOtp, hashCreatedAt, signedData, hashRetries } = field
      if (!hashedOtp || !hashCreatedAt || !signedData) {
        logger.warn({
          message: 'OTP cannot be verified as hash information is missing',
          meta: logMeta,
        })
        return errAsync(new MissingHashDataError())
      }

      if (isOtpExpired(hashCreatedAt)) {
        logger.warn({
          message: 'OTP expired',
          meta: logMeta,
        })
        return errAsync(new OtpExpiredError())
      }

      if (hashRetries >= NUM_OTP_RETRIES) {
        logger.warn({
          message: 'OTP retries exceeded',
          meta: logMeta,
        })
        return errAsync(new OtpRetryExceededError())
      }

      // Important: increment retries before comparing hash
      return ResultAsync.fromPromise(
        VerificationModel.incrementFieldRetries(transactionId, fieldId),
        (error) => {
          // We know field exists, so if error occurs then it must be
          // database error
          logger.error({
            message: 'Error while incrementing hash retries for verified field',
            meta: logMeta,
            error,
          })
          return transformMongoError(error)
        },
      )
        .andThen(() => compareHash(inputOtp, hashedOtp))
        .andThen((doesHashMatch) => {
          if (!doesHashMatch) {
            logger.warn({
              message: 'Wrong OTP',
              meta: logMeta,
            })
            return errAsync(new WrongOtpError())
          }
          return okAsync(signedData)
        })
    }),
  )
}

/**
 * Send otp to recipient
 * @param formId
 * @param field
 * @param recipient
 * @param otp
 */
const sendOtpForField = (
  formId: string,
  field: IVerificationFieldSchema,
  recipient: string,
  otp: string,
): ResultAsync<
  true,
  | DatabaseError
  | MalformedParametersError
  | SmsSendError
  | InvalidNumberError
  | MailSendError
  | NonVerifiedFieldTypeError
> => {
  const { fieldType } = field
  switch (fieldType) {
    case BasicField.Mobile:
      // call sms - it should validate the recipient
      return SmsFactory.sendVerificationOtp(recipient, otp, formId)
    case BasicField.Email:
      // call email - it should validate the recipient
      return MailService.sendVerificationOtp(recipient, otp)
    default:
      return errAsync(new NonVerifiedFieldTypeError(fieldType))
  }
}
