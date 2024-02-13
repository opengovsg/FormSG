import { isEqual } from 'lodash'
import moment from 'moment-timezone'
import mongoose, { Types } from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { PaymentStatus, Product, ProductItem } from '../../../../shared/types'
import { IPaymentSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPaymentModel from '../../models/payment.server.model'
import { MailSendError } from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { InvalidDomainError } from '../auth/auth.errors'
import * as AuthService from '../auth/auth.service'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import { retrieveFormById } from '../form/form.service'
import { performEncryptPostSubmissionActions } from '../submission/encrypt-submission/encrypt-submission.service'
import { isSubmissionEncryptMode } from '../submission/encrypt-submission/encrypt-submission.utils'
import {
  PendingSubmissionNotFoundError,
  SubmissionNotFoundError,
} from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'
import { findSubmissionById } from '../submission/submission.service'

import {
  ConfirmedPaymentNotFoundError,
  InvalidPaymentProductsError,
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
      { 'completedPayment.submissionId': new Types.ObjectId(submissionId) },
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
      'completedPayment.submissionId': new Types.ObjectId(submissionId),
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
        hasReceiptStoredInS3: false,
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
            paymentAmount: payment.amount,
          }))
      )
    })
    .andThen(({ formTitle, formId, submissionId, email, paymentAmount }) => {
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
        paymentAmount,
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
      'completedPayment.paymentDate': {
        $gt: moment().subtract(30, 'days').utc().toDate(),
      },
    })
      .sort({ 'completedPayment.paymentDate': -1 })
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
 * Retrieves all payments that are in Pending or Failed statuses.
 * @returns a list of payments that are incomplete.
 */
export const getIncompletePayments = (): ResultAsync<
  IPaymentSchema[],
  DatabaseError
> => {
  return ResultAsync.fromPromise(
    PaymentModel.getByStatus(PaymentStatus.Pending, PaymentStatus.Failed),
    (error) => {
      logger.error({
        message: 'Database error while retrieving payments by status',
        meta: { action: 'findIncompletePayments' },
        error,
      })
      return new DatabaseError()
    },
  )
}

export const sendOnboardingEmailIfEligible = (
  email: string,
): ResultAsync<true, DatabaseError | InvalidDomainError | MailSendError> => {
  return AuthService.validateEmailDomain(email).andThen(() =>
    MailService.sendPaymentOnboardingEmail({ email }),
  )
}

/**
 * Validates that payment by product is valid
 */
export const validatePaymentProducts = (
  formProductsDefinition: Product[],
  submittedPaymentProducts: ProductItem[],
): Result<true, InvalidPaymentProductsError> => {
  const logMeta = {
    action: 'validatePayments',
  }

  // Check that no duplicate payment products (by id) are selected
  const selectedProducts = submittedPaymentProducts.filter(
    (product) => product.selected,
  )

  const selectedProductIds = new Set(
    selectedProducts.map((product) => product.data._id),
  )

  if (selectedProductIds.size !== selectedProducts.length) {
    logger.error({
      message: 'Duplicate payment products selected',
      meta: logMeta,
    })

    return err(
      new InvalidPaymentProductsError(
        'You have selected a duplicate product. Please refresh and try again.',
      ),
    )
  }

  for (const product of submittedPaymentProducts) {
    // Check that every selected product matches the form definition

    const productIdSubmitted = product.data._id
    const productDefinition = formProductsDefinition.find(
      (product) => String(product._id) === String(productIdSubmitted),
    )
    if (!productDefinition || !isEqual(productDefinition, product.data)) {
      logger.error({
        message: 'Invalid payment product selected.',
        meta: logMeta,
      })
      return err(
        new InvalidPaymentProductsError(
          'There has been a change in the products available. Please refresh and try again.',
        ),
      )
    }

    // Check that the quantity of the product is valid

    if (!productDefinition.multi_qty && product.quantity > 1) {
      logger.error({
        message: 'Invalid payment product quantity',
        meta: logMeta,
      })
      return err(
        new InvalidPaymentProductsError(
          'Selected more than 1 quantity when it is not allowed. Please refresh and try again.',
        ),
      )
    }

    if (productDefinition.multi_qty) {
      if (product.quantity < productDefinition.min_qty) {
        logger.error({
          message:
            'Selected an invalid payment product quantity below the limit',
          meta: logMeta,
        })

        return err(
          new InvalidPaymentProductsError(
            `Selected an invalid quantity below the limit. Please refresh and try again.`,
          ),
        )
      }
      if (product.quantity > productDefinition.max_qty) {
        logger.error({
          message:
            'Selected an invalid payment product quantity above the limit.',
          meta: logMeta,
        })

        return err(
          new InvalidPaymentProductsError(
            `Selected an invalid quantity above the limit. Please refresh and try again.`,
          ),
        )
      }
    }
  }

  return ok(true)
}
