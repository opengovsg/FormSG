import moment from 'moment'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { DateString, PaymentStatus } from '../../../../shared/types'
import { IPaymentSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPaymentModel from '../../models/payment.server.model'
import MailService from '../../services/mail/mail.service'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import { retrieveFormById } from '../form/form.service'
import * as FormService from '../form/form.service'
import * as PendingSubmissionModel from '../pending-submission/pending-submission.service'
import {
  checkFormIsEncryptMode,
  performEncryptPostSubmissionActions,
} from '../submission/encrypt-submission/encrypt-submission.service'
import { isSubmissionEncryptMode } from '../submission/encrypt-submission/encrypt-submission.utils'
import {
  PendingSubmissionNotFoundError,
  SubmissionNotFoundError,
} from '../submission/submission.errors'
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
      session ? { session, readPreference: 'primary' } : null,
    ),
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
 * @param payment the payment to be confirmed
 * @param paymentDate date of the charge success
 * @param receiptUrl the payment's receipt URL
 * @param transactionFee the transaction fee associated with the payment
 * @param {mongoose.ClientSession} session the mongoose session to use for all db operations
 *
 * @returns ok(payment) if the confirmation transaction was successful
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const confirmPaymentPendingSubmission = (
  payment: IPaymentSchema,
  paymentDate: Date,
  receiptUrl: string,
  transactionFee: number,
  session: mongoose.ClientSession,
): ResultAsync<
  IPaymentSchema,
  PendingSubmissionNotFoundError | PaymentAlreadyConfirmedError | DatabaseError
> => {
  // Step 1: Check that the payment has not already been confirmed.
  if (payment.completedPayment) {
    return errAsync(new PaymentAlreadyConfirmedError())
  }

  return (
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
      return okAsync(payment)
    })
  )
}

/**
 * This function sends performs payment post-submission actions. In particular,
 * it fires webhooks, sends email confirmations to respondents and a payment
 * confirmation email to the payer.
 * @param paymentId payment id of the payment that has been completed
 *
 * @returns ok(true) if the payment confirmation email has been sent
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(ConfirmedPaymentNotFoundError) if the paymentId does not have a submission ID associated with a completed payment
 * @returns err(SubmissionNotFoundError) if submission does not exist in the database
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const performPaymentPostSubmissionActions = (
  paymentId: IPaymentSchema['_id'],
): ResultAsync<
  void,
  | PaymentNotFoundError
  | ConfirmedPaymentNotFoundError
  | SubmissionNotFoundError
  | FormNotFoundError
  | DatabaseError
> => {
  const logMeta = {
    action: 'performPaymentPostSubmissionActions',
    paymentId,
  }

  // Step 1: Find payment document
  return findPaymentById(paymentId)
    .andThen((payment) => {
      const submissionId = payment.completedPayment?.submissionId
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
          // Step 3: fire webhooks and send email confirmations.
          .andThen((submission) => {
            if (isSubmissionEncryptMode(submission)) {
              return (
                performEncryptPostSubmissionActions(
                  submission,
                  payment.responses,
                )
                  .andThen(() =>
                    // If successfully sent email confirmations, delete response data from payment document.
                    ResultAsync.fromPromise(
                      PaymentModel.findByIdAndUpdate(paymentId, {
                        responses: [],
                      }),
                      (error) => {
                        logger.error({
                          message: 'Database error while finding payment by id',
                          meta: logMeta,
                          error,
                        })
                        return new DatabaseError(getMongoErrorMessage(error))
                      },
                    ).map(() => submission),
                  )
                  // Ignore failures as they will be logged, but the webhook
                  // response should not be a failure
                  .orElse(() => okAsync(submission))
              )
            }
            return okAsync(submission)
          })
          // Step 4: Find form document
          .andThen((submission) => retrieveFormById(submission.form))
          .map((form) => ({
            formTitle: form.title,
            formId: form._id,
            submissionId,
            email: payment.email,
          }))
      )
    })
    .andThen(({ formTitle, formId, submissionId, email }) => {
      logger.info({
        message: 'Sending payment confirmation email',
        meta: { ...logMeta, submissionId, email },
      })
      // Step 5: Send payment confirmation email
      return MailService.sendPaymentConfirmationEmail({
        email,
        formTitle,
        submissionId,
        formId,
        paymentId,
      })
        .andThen(() => okAsync(undefined))
        .orElse(() => {
          logger.error({
            message: 'Failed to send payment confirmation email',
            meta: { ...logMeta, submissionId, email },
          })
          return okAsync(undefined)
        })
    })
}

const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000
/**
 * Retrieves the latest payment document by email and formId.
 * @param email the email of the payment to be retrieved
 * @param formId the formId of the payment to be retrieved
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findLatestSuccessfulPaymentByEmailAndFormId = (
  email: IPaymentSchema['email'],
  formId: string,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findOne({
      email: email,
      formId: formId,
      status: PaymentStatus.Succeeded,
    })
      .sort({ _id: -1 })
      .exec(),
    (error) => {
      logger.error({
        message:
          'Database error while finding latest payment by email and FormId',
        meta: {
          action: 'findLatestPaymentByEmailAndFormId',
          formId,
          email,
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
 * Retrieves payments that are in PaymentStatus.Pending satisfying X hours agos
 * @param createdHrsAgo defaults to 72
 * @returns
 */

export const findPendingPaymentsByTime = (createdHrsAgo = 72) => {
  const logMeta = {
    action: 'findPaymentByTime',
    createdHrsAgo,
  }
  const positiveHrsAgo = Math.max(createdHrsAgo, 1)
  const msAgo = MILLISECONDS_IN_AN_HOUR * positiveHrsAgo
  const _createdAfter = moment
    .tz(Date.now() - msAgo, 'Asia/Singapore')
    .toISOString() as DateString

  return ResultAsync.fromPromise(
    PaymentModel.getPaymentBetweenDatesByType(
      PaymentStatus.Pending,
      _createdAfter,
    ),
    (error) => {
      logger.error({
        message: 'Database error while starting mongoose session',
        meta: logMeta,
        error,
      })
      return new DatabaseError()
    },
  ).andThen((payments) =>
    ResultAsync.combine(
      payments.map((payment) =>
        PendingSubmissionModel.findPendingSubmissionById(
          payment.pendingSubmissionId,
        )
          .andThen((submission) =>
            FormService.retrieveFullFormById(submission.form),
          )
          .andThen(checkFormIsEncryptMode) // Payment forms are encrypted
          .andThen((form) => {
            const stripeAccount = form.payments_channel?.target_account_id
            return okAsync({
              stripeAccount,
              paymentIntentId: payment.paymentIntentId,
              paymentId: payment._id,
              paymentCreationTime: payment.created,
            })
          })
          .orElse((error) => {
            logger.warn({
              message: `Error when resolving stripeAccount.`,
              meta: { ...logMeta, paymentId: payment._id },
              error,
            })
            return okAsync({
              stripeAccount: '-1',
              paymentIntentId: payment.paymentIntentId,
              paymentId: payment._id,
              paymentCreationTime: payment.created,
            })
          }),
      ),
    ),
  )
}
