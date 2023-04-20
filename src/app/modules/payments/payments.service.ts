import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { IPaymentSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPaymentModel from '../../models/payment.server.model'
import MailService from '../../services/mail/mail.service'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'
import { retrieveFormById } from '../form/form.service'
import { performEncryptPostSubmissionActions } from '../submission/encrypt-submission/encrypt-submission.service'
import { isSubmissionEncryptMode } from '../submission/encrypt-submission/encrypt-submission.utils'
import { PendingSubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'
import { findSubmissionById } from '../submission/submission.service'

import {
  ConfirmedPaymentNotFoundError,
  PaymentAlreadyConfirmedError,
  PaymentNotFoundError,
} from './payments.errors'

const logger = createLoggerWithLabel(module)
const PaymentModel = getPaymentModel(mongoose)

/**
 * Retrieves payment by Id.
 * @param paymentId the payment id of the payment to be retrieved
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findPaymentById = (
  paymentId: IPaymentSchema['_id'],
  session?: mongoose.ClientSession,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findById(
      paymentId,
      null,
      // readPreference from transaction isn't respected, thus we are setting it on operation
      session ? { readPreference: 'primary' } : null,
    ).session(session ? session : null),
    (error) => {
      logger.error({
        message: 'Database error while finding payment by id',
        meta: {
          action: 'findPaymentById',
          paymentId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((result) => {
    if (!result) return errAsync(new PaymentNotFoundError())
    return okAsync(result)
  })
}

/**
 * Retrieves submission document of the given SubmissionId.
 * @param submissionId the submissionId of the payment to be retrieved
 * @param update mongoose update to perform
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findBySubmissionIdAndUpdate = (
  submissionId: string,
  update?:
    | mongoose.UpdateWithAggregationPipeline
    | mongoose.UpdateQuery<IPaymentSchema>,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findOneAndUpdate(
      { 'completedPayment.submissionId': new ObjectId(submissionId) },
      update,
    ).exec(),
    (error) => {
      logger.error({
        message: 'Error updating payment in database',
        meta: {
          action: 'findBySubmissionIdAndUpdate',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((result) => {
    if (!result) return errAsync(new PaymentNotFoundError())
    return okAsync(result)
  })
}

/**
 * Retrieves payment document of the given submissionId.
 * @param submissionId the submissionId of the payment to be retrieved
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findPaymentBySubmissionId = (
  submissionId: string,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findOne({
      'completedPayment.submissionId': new ObjectId(submissionId),
    }),
    (error) => {
      logger.error({
        message: 'Database find payment submissionId error',
        meta: {
          action: 'findPaymentBySubmissionId',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((payment) => {
    if (!payment) {
      return errAsync(new PaymentNotFoundError())
    }
    return okAsync(payment)
  })
}

/**
 * This function confirms a submission that is pending payment and updates the
 * payment document with the new submission id, receipt URL and transaction fee.
 * This is done within a single transaction, so that the information in the
 * document is always consistent.
 * @requires paymentId must reference a payment document such that payment.completedPayment is undefined
 *
 * @param paymentId payment id of the payment to be confirmed
 * @param paymentDate date of the charge success
 * @param receiptUrl the payment's receipt URL
 * @param transactionFee the transaction fee associated with the payment
 *
 * @returns ok(payment) if the confirmation transaction was successful
 * @returns err(PaymentNotFoundError) if the paymentId was not valid
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const confirmPaymentPendingSubmission = (
  paymentId: IPaymentSchema['_id'],
  paymentDate: Date,
  receiptUrl: string,
  transactionFee: number,
): ResultAsync<
  IPaymentSchema,
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | DatabaseError
> => {
  const logMeta = {
    action: 'confirmPaymentPendingSubmission',
    paymentId,
  }

  // Step 0: Set up the session and start the transaction
  return (
    ResultAsync.fromPromise(mongoose.startSession(), (error) => {
      logger.error({
        message: 'Database error while starting mongoose session',
        meta: logMeta,
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    })
      .andThen((session) => {
        session.startTransaction({
          readPreference: 'primary',
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        })

        return (
          // Step 1: Retrieve the payment by payment id and check that the payment
          // has not already been confirmed.
          findPaymentById(paymentId, session)
            .andThen((payment) =>
              payment.completedPayment
                ? errAsync(new PaymentAlreadyConfirmedError())
                : okAsync(payment),
            )
            .andThen((payment) =>
              // Step 2: Copy the pending submission to the submissions collection
              SubmissionService.copyPendingSubmissionToSubmissions(
                payment.pendingSubmissionId,
                session,
              ).andThen((submission) => {
                // Step 3: Update the payment document with the metadata showing that
                // the payment is complete and save it
                payment.completedPayment = {
                  submissionId: submission._id,
                  paymentDate,
                  receiptUrl,
                  transactionFee,
                }
                return ResultAsync.fromPromise(
                  payment.save({ session }),
                  (error) => {
                    logger.error({
                      message: 'Database error while saving payment document',
                      meta: logMeta,
                      error,
                    })
                    return new DatabaseError(getMongoErrorMessage(error))
                  },
                ).andThen(() => okAsync(submission))
              }),
            )
            // Finally: Commit or abort depending on whether an error was caught,
            // then end the session
            .andThen((submission) => {
              return ResultAsync.fromPromise(
                session.commitTransaction(),
                (error) => {
                  logger.error({
                    message: 'Database error while committing transaction',
                    meta: logMeta,
                    error,
                  })
                  return new DatabaseError(getMongoErrorMessage(error))
                },
              ).andThen(() => {
                session.endSession()
                return okAsync(submission)
              })
            })
            .orElse((err) => {
              return ResultAsync.fromPromise(
                session.abortTransaction(),
                (error) => {
                  logger.error({
                    message: 'Database error while aborting transaction',
                    meta: logMeta,
                    error,
                  })
                  return new DatabaseError(getMongoErrorMessage(error))
                },
              ).andThen(() => {
                session.endSession()
                return errAsync(err)
              })
            })
        )
      })
      // Post-submission: fire webhooks and send email confirmations.
      .andThen((submission) =>
        findPaymentById(paymentId).andThen((payment) => {
          if (isSubmissionEncryptMode(submission)) {
            return performEncryptPostSubmissionActions(
              submission,
              payment.responses,
            )
              .andThen(() => {
                // If successfully sent email confirmations, delete response data from payment document.
                payment.responses = []
                return ResultAsync.fromPromise(payment.save(), (error) => {
                  logger.error({
                    message:
                      'Database error while deleting responses from payment',
                    meta: logMeta,
                    error,
                  })
                  return new DatabaseError(getMongoErrorMessage(error))
                }).andThen(() => okAsync(payment))
              })
              .orElse(() => okAsync(payment))
          }
          return okAsync(payment)
        }),
      )
  )
}

/**
 * This function sends a payment confirmation email
 * @param paymentId payment id of the payment that has been completed
 *
 * @returns ok(true) if the payment confirmation email has been sent
 * @returns err(ConfirmedPaymentNotFoundError) if the paymentId does not have a submission ID associated with a completed payment
 */
export const sendPaymentConfirmationEmailByPaymentId = (
  paymentId: IPaymentSchema['_id'],
): ResultAsync<true, ConfirmedPaymentNotFoundError> => {
  const logMeta = {
    action: 'sendPaymentConfirmationEmail',
    paymentId,
  }

  // Step 1: Find payment object
  return findPaymentById(paymentId)
    .map((payment) => ({
      submissionId: payment.completedPayment?.submissionId,
      recipient: payment.email,
    }))
    .andThen(({ submissionId, recipient }) => {
      if (!submissionId) {
        logger.warn({
          message: 'Submission ID from completed payment could not be found',
          meta: logMeta,
        })
        return errAsync(new ConfirmedPaymentNotFoundError())
      }
      // Step 2: Find submission document
      return (
        findSubmissionById(submissionId)
          // Step 3: Find form document
          .andThen((submission) => retrieveFormById(submission.form))
          .map((form) => ({
            formTitle: form.title,
            formId: form._id,
            responseId: submissionId,
            recipient,
          }))
      )
    })
    .andThen(({ formTitle, formId, responseId, recipient }) => {
      logger.info({
        message: 'sendPaymentConfirmationEmail',
        meta: logMeta,
      })
      // Step 4: Send payment confirmation email
      return MailService.sendPaymentConfirmationEmail({
        recipient,
        formTitle,
        responseId,
        formId,
        paymentId,
      })
    })
}
