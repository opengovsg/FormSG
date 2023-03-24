import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { IPaymentSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPaymentModel from '../../models/payment.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'
import { PendingSubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import {
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
    PaymentModel.findById(paymentId).session(session ?? null),
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
    PaymentModel.findOneAndUpdate({ submissionId }, update).exec(),
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
    PaymentModel.findBySubmissionId(submissionId),
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
 * @param paymentId payment id of the payment to be confirmed
 * @param receiptUrl the payment's receipt URL
 * @param transactionFee the transaction fee associated with the payment
 *
 * @returns ok(payment) if the confirmation transaction was successful
 * @returns err(PaymentNotFoundError) if the paymentId was not valid
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
  return ResultAsync.fromPromise(mongoose.startSession(), (error) => {
    logger.error({
      message: 'Database error while starting mongoose session',
      meta: logMeta,
      error,
    })
    return new DatabaseError(getMongoErrorMessage(error))
  }).andThen((session) => {
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
            )
          }),
        )
        // Finally: Commit or abort depending on whether an error was caught,
        // then end the session
        .andThen((payment) => {
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
            return okAsync(payment)
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
}
