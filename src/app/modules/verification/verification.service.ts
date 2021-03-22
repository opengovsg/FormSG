import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { NUM_OTP_RETRIES, SALT_ROUNDS } from '../../../shared/util/verification'
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
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { generateOtp } from '../../utils/otp'
import { DatabaseError, MalformedParametersError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import * as FormService from '../form/form.service'

import {
  FieldNotFoundInTransactionError,
  MissingHashDataError,
  NonVerifiedFieldTypeError,
  OtpExpiredError,
  OtpHashingError,
  OtpRetryExceededError,
  TransactionExpiredError,
  TransactionNotFoundError,
  WaitForOtpError,
  WrongOtpError,
} from './verification.errors'
import getVerificationModel from './verification.model'
import {
  isOtpExpired,
  isOtpWaitTimeElapsed,
  isTransactionExpired,
} from './verification.util'

const VerificationModel = getVerificationModel(mongoose)

const logger = createLoggerWithLabel(module)

/**
 *  Creates a transaction for a form that has verifiable fields
 * @param formId
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
export const getTransaction = (
  transactionId: string,
): ResultAsync<
  IVerificationSchema,
  TransactionNotFoundError | DatabaseError
> => {
  const logMeta = {
    action: 'getTransaction',
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
    return okAsync(transaction)
  })
}

/**
 *  Sets signedData, hashedOtp, hashCreatedAt to null for that field in that transaction
 *  @param transaction
 *  @param fieldId
 */
export const resetFieldForTransaction = (
  transactionId: string,
  fieldId: string,
): ResultAsync<
  IVerificationSchema,
  TransactionNotFoundError | FieldNotFoundInTransactionError | DatabaseError
> => {
  const logMeta = {
    action: 'resetFieldForTransaction',
    transactionId,
    fieldId,
  }
  return getTransaction(transactionId)
    .andThen((transaction) =>
      ResultAsync.fromPromise(transaction.resetField(fieldId), (error) => {
        logger.error({
          message: 'Error while resetting field data in transaction',
          meta: logMeta,
          error,
        })
        return new DatabaseError(getMongoErrorMessage(error))
      }),
    )
    .andThen((updatedTransaction) => {
      if (!updatedTransaction) {
        logger.error({
          message: 'Field ID does not exist in transaction',
          meta: logMeta,
        })
        return errAsync(new FieldNotFoundInTransactionError())
      }
      return okAsync(updatedTransaction)
    })
}

/**
 *  Generates hashed otp and signed data for the given transaction, fieldId, and answer
 * @param transaction
 * @param fieldId
 * @param answer
 */
export const sendNewOtp = (
  transactionId: string,
  fieldId: string,
  answer: string,
): ResultAsync<
  IVerificationSchema,
  | TransactionNotFoundError
  | DatabaseError
  | FieldNotFoundInTransactionError
  | TransactionExpiredError
  | OtpHashingError
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
  const otp = generateOtp()
  return getTransaction(transactionId).andThen((transaction) => {
    if (isTransactionExpired(transaction)) {
      logger.warn({
        message: 'OTP cannot be sent as transaction has expired',
        meta: logMeta,
      })
      return errAsync(new TransactionExpiredError())
    }

    const field = transaction.getField(fieldId)
    if (!field) {
      logger.warn({
        message: 'Field ID not found for transaction',
        meta: logMeta,
      })
      return errAsync(new FieldNotFoundInTransactionError())
    }

    if (!isOtpWaitTimeElapsed(field.hashCreatedAt)) {
      logger.warn({
        message: 'OTP requested before waiting time elapsed',
        meta: logMeta,
      })
      return errAsync(new WaitForOtpError())
    }

    return ResultAsync.fromPromise(bcrypt.hash(otp, SALT_ROUNDS), (error) => {
      logger.error({
        message: 'Error while hashing new OTP',
        meta: logMeta,
        error,
      })
      return new OtpHashingError()
    }).andThen((hashedOtp) => {
      const signedData = formsgSdk.verification.generateSignature({
        transactionId,
        formId: transaction.formId,
        fieldId,
        answer,
      })

      return sendOtpForField(transaction.formId, field, answer, otp)
        .andThen(() =>
          ResultAsync.fromPromise(
            transaction.updateDataForField({
              fieldId,
              hashCreatedAt: new Date(),
              hashRetries: 0,
              hashedOtp,
              signedData,
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
          ),
        )
        .andThen((newTransaction) => {
          // transaction.updateDataForField may return null if the field ID does not exist.
          // We already checked that the field ID exists, but guard this case for safety.
          if (!newTransaction) {
            logger.warn({
              message: 'Field ID not found for transaction',
              meta: logMeta,
            })
            return errAsync(new FieldNotFoundInTransactionError())
          }
          return okAsync(newTransaction)
        })
    })
  })
}

/**
 * Compares the given otp. If correct, returns signedData, else returns an error
 * @param transaction
 * @param fieldId
 * @param inputOtp
 */
export const verifyOtp = (
  transactionId: string,
  fieldId: string,
  inputOtp: string,
): ResultAsync<
  string,
  | TransactionNotFoundError
  | DatabaseError
  | FieldNotFoundInTransactionError
  | TransactionExpiredError
  | MissingHashDataError
  | OtpExpiredError
  | OtpRetryExceededError
  | WrongOtpError
  | OtpHashingError
> => {
  const logMeta = {
    action: 'verifyOtp',
    transactionId,
    fieldId,
  }
  return getTransaction(transactionId).andThen((transaction) => {
    if (isTransactionExpired(transaction)) {
      logger.warn({
        message: 'OTP cannot be verified as transaction has expired',
        meta: logMeta,
      })
      return errAsync(new TransactionExpiredError())
    }

    const field = transaction.getField(fieldId)
    if (!field) {
      logger.warn({
        message: 'Field ID not found for transaction',
        meta: logMeta,
      })
      return errAsync(new FieldNotFoundInTransactionError())
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
      transaction.incrementFieldRetries(fieldId),
      (error) => {
        // We know field exists, so if error occurs then it must be
        // database error
        logger.error({
          message: 'Error while incrementing hash retries for verified field',
          meta: logMeta,
          error,
        })
        return new DatabaseError(getMongoErrorMessage(error))
      },
    )
      .andThen(() =>
        ResultAsync.fromPromise(
          bcrypt.compare(inputOtp, hashedOtp),
          (error) => {
            logger.error({
              message: 'Error while hashing OTP for verification',
              meta: logMeta,
              error,
            })
            return new OtpHashingError()
          },
        ),
      )
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
  })
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
