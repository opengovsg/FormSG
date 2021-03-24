import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import * as VfnUtils from '../../../shared/util/verification'
import {
  IVerificationFieldSchema,
  IVerificationSchema,
  PublicTransaction,
} from '../../../types'
import { MailSendError } from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { InvalidNumberError, SmsSendError } from '../../services/sms/sms.errors'
import { SmsFactory } from '../../services/sms/sms.factory'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import {
  ApplicationError,
  DatabaseError,
  MalformedParametersError,
} from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import * as FormService from '../form/form.service'

import {
  FieldNotFoundInTransactionError,
  NonVerifiedFieldTypeError,
  TransactionExpiredError,
  TransactionNotFoundError,
  WaitForOtpError,
} from './verification.errors'
import getVerificationModel from './verification.model'
import { SendOtpParams } from './verification.types'
import { isOtpWaitTimeElapsed, isTransactionExpired } from './verification.util'

const logger = createLoggerWithLabel(module)

const VerificationModel = getVerificationModel(mongoose)

const { HASH_EXPIRE_AFTER_SECONDS, NUM_OTP_RETRIES, VfnErrors } = VfnUtils

/**
 *  Creates a transaction for a form that has verifiable fields
 * @param formId
 * @returns ok(created transaction or null) if form has no verifiable fields.
 * @returns err(FormNotFoundError) when form does not exist
 * @returns err(DatabaseError) when database read/write errors
 */
export const createTransaction = (
  formId: string,
): ResultAsync<
  IVerificationSchema | null,
  FormNotFoundError | DatabaseError
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
        return new DatabaseError(getMongoErrorMessage(error))
      },
    ),
  )
}

/**
 *  Retrieves a transaction's metadata by id
 * @param transactionId
 * @returns ok(transaction metadata)
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(DatabaseError) when database read/write errors
 */
export const getTransactionMetadata = (
  transactionId: string,
): ResultAsync<PublicTransaction, TransactionNotFoundError | DatabaseError> => {
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
      return new DatabaseError(getMongoErrorMessage(error))
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
 * Retrieves an entire transaction
 * @param transactionId
 */
export const getTransaction = async (
  transactionId: string,
): Promise<IVerificationSchema> => {
  const transaction = await VerificationModel.findById(transactionId)
  if (!transaction) {
    return throwError(VfnErrors.TransactionNotFound)
  }
  return transaction
}

/**
 * Retrieves an entire transaction and validates that it is not expired
 * @param transactionId
 * @returns ok(transaction)
 * @returns err(TransactionNotFoundError) when transaction ID does not exist
 * @returns err(TransactionExpiredError) when transaction is expired
 * @returns err(DatabaseError) when database read/write errors
 */
const getValidTransaction = (
  transactionId: string,
): ResultAsync<
  IVerificationSchema,
  TransactionNotFoundError | DatabaseError | TransactionExpiredError
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
      return new DatabaseError(getMongoErrorMessage(error))
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
        meta: logMeta,
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
 * @returns err(DatabaseError) when database read/write errors
 */
export const resetFieldForTransaction = (
  transactionId: string,
  fieldId: string,
): ResultAsync<
  IVerificationSchema,
  | TransactionNotFoundError
  | TransactionExpiredError
  | FieldNotFoundInTransactionError
  | DatabaseError
> => {
  const logMeta = {
    action: 'resetFieldForTransaction',
    transactionId,
    fieldId,
  }
  // Ensure that field ID exists first
  return (
    getValidTransaction(transactionId)
      .andThen((transaction) => getFieldFromTransaction(transaction, fieldId))
      // Apply atomic update
      .andThen(() =>
        ResultAsync.fromPromise(
          VerificationModel.resetField(transactionId, fieldId),
          (error) => {
            logger.error({
              message: 'Error while resetting field data in transaction',
              meta: logMeta,
              error,
            })
            return new DatabaseError(getMongoErrorMessage(error))
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
 * @returns err(DatabaseError) when database read/write errors
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
  | DatabaseError
  | FieldNotFoundInTransactionError
  | TransactionExpiredError
  | WaitForOtpError
  | MalformedParametersError
  | SmsSendError
  | InvalidNumberError
  | MailSendError
  | NonVerifiedFieldTypeError
> => {
  const logMeta = {
    action: 'sendNewOtp',
    transactionId,
    fieldId,
  }
  return getValidTransaction(transactionId).andThen((transaction) =>
    getFieldFromTransaction(transaction, fieldId)
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
            return new DatabaseError(getMongoErrorMessage(error))
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
      }),
  )
}

/**
 * Compares the given otp. If correct, returns signedData, else returns an error
 * @param transaction
 * @param fieldId
 * @param inputOtp
 */
export const verifyOtp = async (
  transaction: IVerificationSchema,
  fieldId: string,
  inputOtp: string,
): Promise<string> => {
  // TODO (#317): remove usage of non-null assertion
  if (isDateExpired(transaction.expireAt!)) {
    throwError(VfnErrors.TransactionNotFound)
  }
  const field = getFieldOrUndefined(transaction, fieldId)
  if (!field) {
    return throwError('Field not found in transaction', VfnErrors.FieldNotFound)
  }
  const { hashedOtp, hashCreatedAt, signedData, hashRetries } = field
  if (
    hashedOtp &&
    hashCreatedAt &&
    !isHashedOtpExpired(hashCreatedAt) &&
    NUM_OTP_RETRIES > hashRetries!
  ) {
    await VerificationModel.updateOne(
      { _id: transaction._id, 'fields._id': fieldId },
      {
        $set: {
          'fields.$.hashRetries': hashRetries! + 1,
        },
      },
    )
    const validOtp = await bcrypt.compare(inputOtp, hashedOtp)
    return validOtp ? signedData! : throwError(VfnErrors.InvalidOtp)
  }
  return throwError(VfnErrors.ResendOtp)
}

/**
 * Send otp to recipient
 *
 * @param formId
 * @param field
 * @param field.fieldType
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
  | ApplicationError
> => {
  const { fieldType } = field
  switch (fieldType) {
    case 'mobile':
      // call sms - it should validate the recipient
      return SmsFactory.sendVerificationOtp(recipient, otp, formId)
    case 'email':
      // call email - it should validate the recipient
      return MailService.sendVerificationOtp(recipient, otp)
    default:
      return errAsync(
        new ApplicationError(
          'Unsupported field type passed to sendOtpForField',
          { fieldType },
        ),
      )
  }
}

/**
 * Checks if expireAt is in the past -- ie transaction has expired
 * @param expireAt
 * @returns boolean
 */
const isDateExpired = (expireAt: Date): boolean => {
  const currentDate = new Date()
  return expireAt < currentDate
}

/**
 * Checks if HASH_EXPIRE_AFTER_SECONDS has elapsed since the hash was created - ie hash has expired
 * @param hashCreatedAt
 */
const isHashedOtpExpired = (hashCreatedAt: Date): boolean => {
  const currentDate = new Date()
  const expireAt = VfnUtils.getExpiryDate(
    HASH_EXPIRE_AFTER_SECONDS,
    hashCreatedAt,
  )
  return expireAt < currentDate
}

/**
 *  Finds a field by id in a transaction
 * @param transaction
 * @param fieldId
 * @returns verification field
 */
const getFieldOrUndefined = (
  transaction: IVerificationSchema,
  fieldId: string,
): IVerificationFieldSchema | undefined => {
  return transaction.fields.find((field) => field._id === fieldId)
}

/**
 * Helper method to throw an error
 * @param message
 * @param name
 */
const throwError = (message: string, name?: string): never => {
  const error = new Error(message)
  error.name = name || message
  // TODO(#941) Convert this service to use neverthrow, and re-examine type assertions made
  // eslint-disable-next-line
  throw error
}
