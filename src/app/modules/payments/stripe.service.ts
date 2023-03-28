// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import cuid from 'cuid'
import get from 'lodash/get'
import mongoose, { ClientSession } from 'mongoose'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'
import isURL from 'validator/lib/isURL'

import { IPopulatedEncryptedForm } from '../../../types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { ApplicationError, DatabaseError } from '../core/core.errors'
import { PendingSubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import { PaymentNotFoundError } from './payments.errors'
import {
  ComputePaymentStateError,
  MalformedStripeChargeObjectError,
  StripeAccountError,
  StripeAccountNotFoundError,
  StripeFetchError,
  StripeMetadataPaymentIdInvalidError,
  StripeMetadataPaymentIdNotFoundError,
} from './stripe.errors'
import { computePaymentState, getRedirectUri } from './stripe.utils'

const logger = createLoggerWithLabel(module)
const Payment = getPaymentModel(mongoose)

/**
 * Only used to pass exceptional control from the transaction function back to
 * the caller which is responsible for aborting the transaction.
 * NOTE: Exported only for testing
 */
export class DuplicateEventError extends ApplicationError {
  constructor(message = 'Duplicate event processed') {
    super(message)
  }
}

/**
 * Retrieves and updates payment document of the given submissionId with the event
 * NOTE: Exported only for testing
 * @param paymentId the id of the payment document to be updated
 * @param event the new Stripe Event causing the update operation to occur
 * @param session the mongoose session this transaction is to be run within
 * @returns ok() if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DuplicateEventError) if a duplicate event is found to be processed
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(MalformedStripeChargeObjectError) if the receipt URL or balance transaction was not found in the charge object
 * @returns err(StripeFetchError) if there was an error fetching data from Stripe
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const processStripeEventTxn = (
  paymentId: string,
  event: Stripe.Event,
  session: ClientSession,
): ResultAsync<
  void,
  | DatabaseError
  | PaymentNotFoundError
  | DuplicateEventError
  | PendingSubmissionNotFoundError
  | MalformedStripeChargeObjectError
  | StripeFetchError
  | ComputePaymentStateError
> => {
  const logMeta = {
    action: 'updateEventLogByPaymentId',
    paymentId,
    event,
  }

  return ResultAsync.fromPromise(
    // Step 1: Get the payment. If the submission does not exist or the event
    // has been processed before, ignore the event.
    Payment.findById(paymentId).session(session),
    (error) => {
      logger.error({
        message: 'Error encountered while finding payment by id',
        meta: logMeta,
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
    .andThen((payment) => {
      if (!payment) {
        return errAsync(new PaymentNotFoundError())
      }

      if (payment.webhookLog.some((e) => e.id === event.id)) {
        // Stop processing if we encounter a duplicate event. This may have
        // occurred due to various reasons (e.g. us timing out on Stripe, so
        // Stripe retried the webhook).
        return errAsync(new DuplicateEventError())
      }

      // Step 2: If the event type is charge.succeeded, and there is not already
      // completed payment metadata, we need to confirm the payment on our end.
      if (event.type === 'charge.succeeded' && !payment.completedPayment) {
        // Step 2a. Copy the pending submission to submissions collection.
        return SubmissionService.copyPendingSubmissionToSubmissions(
          payment.pendingSubmissionId,
          session,
        ).andThen((submission) => {
          // Step 2b. Obtain the other data (i.e. receipt url from charge,
          // transaction fee from balance transaction)
          const charge = event.data.object as Stripe.Charge
          const receiptUrl = charge.receipt_url

          // Note that for paynow expired payments in test mode, stripe returns receipt_url with 'null' string
          if (!receiptUrl || !isURL(receiptUrl)) {
            return errAsync(new MalformedStripeChargeObjectError())
          }

          if (!charge.balance_transaction) {
            return errAsync(new MalformedStripeChargeObjectError())
          }

          return (
            ResultAsync.fromPromise(
              // Step 2c: Retrieve transaction fee associated with balance transaction object
              typeof charge.balance_transaction === 'string'
                ? stripe.balanceTransactions.retrieve(
                    charge.balance_transaction,
                    undefined,
                    { stripeAccount: payment.target_account_id },
                  )
                : Promise.resolve(charge.balance_transaction),
              (error) => {
                logger.error({
                  message: 'Error retrieving balance transaction object',
                  meta: {
                    action: 'getPaymentFromLatestSuccessfulCharge',
                  },
                  error,
                })
                return new StripeFetchError()
              },
            )
              .andThen((balanceTransaction) =>
                okAsync(
                  balanceTransaction.fee_details
                    .filter((feeDetail) => feeDetail.type === 'stripe_fee')
                    .map((feeDetail) => feeDetail.amount)
                    .reduce((a, b) => a + b),
                ),
              )
              // Step 2c: Update the payment object with the new completed payment metadata
              .andThen((transactionFee) => {
                payment.completedPayment = {
                  submissionId: submission._id,
                  paymentDate: new Date(event.created),
                  transactionFee,
                  receiptUrl,
                }
                return okAsync(payment)
              })
          )
        })
      }
      return okAsync(payment)
    })
    .andThen((payment) => {
      // Step 3: Inject the event into the correct position into the array.
      // We expect webhook arrays to be small (~10 entries max), so push and
      // sort is ok.
      payment.webhookLog.push(event)
      payment.webhookLog.sort((e1, e2) => e1.created - e2.created)

      // Step 4: Recompute the payment state based on the event log.
      return computePaymentState(payment.webhookLog).asyncAndThen(
        ({ status, chargeIdLatest }) => {
          // Step 5: Update the payment state.
          payment.status = status
          payment.chargeIdLatest = chargeIdLatest
          return okAsync(payment)
        },
      )
    })
    .andThen((payment) =>
      // Step 6: Save the payment object.
      ResultAsync.fromPromise(payment.save({ session }), (error) => {
        logger.error({
          message: 'Error encountered while updating payment',
          meta: logMeta,
          error,
        })
        return new DatabaseError(getMongoErrorMessage(error))
      }),
    )
    .andThen(() => okAsync(undefined))
}

/**
 * Retrieves and updates payment document of the given paymentId with the event.
 * This is done within a single transaction, so that the information in the
 * document is always consistent.
 * @param metadata the metadata associated with the payment, from the Stripe Event
 * @param event the new Stripe Event causing the update operation to occur
 * @returns ok(payment) if payment exists
 * @returns err(EventMetadataPaymentIdNotFoundError) if the payment id does not exist in the metadata
 * @returns err(EventMetadataPaymentIdInvalidError) if the payment id found in the event metadata is an invalid BSON object id
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const processStripeEvent = (
  metadata: Stripe.Metadata | null,
  event: Stripe.Event,
): ResultAsync<
  void,
  | StripeMetadataPaymentIdNotFoundError
  | StripeMetadataPaymentIdInvalidError
  | PaymentNotFoundError
  | ComputePaymentStateError
  | PendingSubmissionNotFoundError
  | DatabaseError
> => {
  const logMeta = {
    action: 'updateEventLogById',
    metadata,
    event,
  }

  const paymentId = get(metadata, 'paymentId') // TODO: Extract this value to a constant
  if (!paymentId) {
    logger.warn({
      message: 'Stripe event metadata does not contain paymentId',
      meta: logMeta,
    })
    return errAsync(new StripeMetadataPaymentIdNotFoundError())
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    logger.warn({
      message: 'Stripe metadata contains invalid paymentId',
      meta: {
        paymentId,
        ...logMeta,
      },
    })
    return errAsync(new StripeMetadataPaymentIdInvalidError())
  }

  logger.info({
    message: 'Starting mongoose transaction to update payment via webhook',
    meta: {
      paymentId,
      ...logMeta,
    },
  })

  return ResultAsync.fromPromise(
    mongoose.startSession({
      defaultTransactionOptions: {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary',
      },
    }),
    (error) => {
      logger.error({
        message: 'Error encountered while starting mongoose session',
        meta: logMeta,
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((session) => {
    // Start the transaction
    session.startTransaction()

    return processStripeEventTxn(paymentId, event, session)
      .andThen(() => {
        // Commit if successful
        logger.error({
          message: 'Committing update payment via webhook transaction',
          meta: {
            paymentId,
            ...logMeta,
          },
        })

        return ResultAsync.fromPromise(session.commitTransaction(), (error) => {
          logger.error({
            message: 'Error encountered while committing transaction',
            meta: logMeta,
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        }).andThen(() => {
          session.endSession()
          return okAsync(undefined)
        })
      })
      .orElse((error) => {
        // Abort otherwise
        logger.error({
          message: 'Aborting update payment via webhook transaction',
          meta: {
            paymentId,
            error,
            ...logMeta,
          },
        })

        return ResultAsync.fromPromise(session.abortTransaction(), (error) => {
          logger.error({
            message: 'Error encountered while aborting transaction',
            meta: logMeta,
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        }).andThen(() => {
          session.endSession()
          // A duplicate event should abort the transaction but it's not a real
          // error, so we intercept it
          if (error instanceof DuplicateEventError) return okAsync(undefined)
          return errAsync(error)
        })
      })
  })
}

export const getStripeOauthUrl = (form: IPopulatedEncryptedForm) => {
  const state = `${form._id}.${cuid()}`

  return ok({
    authUrl: stripe.oauth.authorizeUrl({
      client_id: paymentConfig.stripeClientID,
      response_type: 'code',
      scope: 'read_write',
      state,
      redirect_uri: getRedirectUri(),
    }),
    state,
  })
}

export const exchangeCodeForAccessToken = (
  code: string,
): ResultAsync<
  MarkRequired<Stripe.OAuthToken, 'stripe_user_id' | 'stripe_publishable_key'>,
  StripeAccountError | StripeFetchError
> => {
  return ResultAsync.fromPromise(
    stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    }),
    (error) => {
      logger.error({
        message: 'Error exchanging Stripe code for access token',
        meta: {
          action: 'exchangeCodeForAccessToken',
        },
        error,
      })
      return new StripeFetchError(String(error))
    },
  ).andThen((token) => {
    if (!token.stripe_user_id) {
      return errAsync(new StripeAccountError('Stripe account ID is missing'))
    }
    return okAsync(
      token as MarkRequired<
        Stripe.OAuthToken,
        'stripe_user_id' | 'stripe_publishable_key'
      >,
    )
  })
}

export const linkStripeAccountToForm = (
  form: IPopulatedEncryptedForm,
  {
    accountId,
    publishableKey,
  }: {
    accountId: string
    publishableKey: string
  },
): ResultAsync<string, DatabaseError> => {
  // Check if form already has account id
  if (form.payments_channel?.target_account_id) {
    return okAsync(form.payments_channel.target_account_id)
  }

  // No account id, create and inject into form
  return ResultAsync.fromPromise(
    form.addPaymentAccountId({ accountId, publishableKey }),
    (error) => {
      const errMsg = 'Failed to update payment account id'
      logger.error({
        message: errMsg,
        meta: {
          action: 'linkStripeAccountToForm',
          stripeAccountId: accountId,
          stripePublishableKey: publishableKey,
          formId: form._id,
        },
        error,
      })
      return new DatabaseError(errMsg)
    },
  ).map((updatedForm) => updatedForm.payments_channel.target_account_id)
}

export const unlinkStripeAccountFromForm = (form: IPopulatedEncryptedForm) => {
  if (!form.payments_channel?.target_account_id) {
    return okAsync(true)
  }

  return ResultAsync.fromPromise(form.removePaymentAccount(), (error) => {
    const errMsg = 'Failed to remove payment account from form'
    logger.error({
      message: errMsg,
      meta: {
        action: 'unlinkStripeAccountFromForm',
        formId: form._id,
      },
      error,
    })
    return new DatabaseError(errMsg)
  })
}

export const createAccountLink = (
  accountId: string,
  redirectFormId: string,
) => {
  return ResultAsync.fromPromise(
    stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${config.app.appUrl}/admin/form/${redirectFormId}/settings`,
      return_url: `${config.app.appUrl}/admin/form/${redirectFormId}/settings`,
      type: 'account_onboarding',
    }),
    (error) => {
      logger.error({
        message: 'Failed to create account link',
        meta: {
          action: 'createAccountLink',
          accountId,
          formId: redirectFormId,
        },
        error,
      })
      return new StripeAccountError(String(error))
    },
  )
}

export const validateAccount = (
  accountId?: string,
): ResultAsync<
  Stripe.Response<Stripe.Account> | null,
  StripeAccountError | StripeAccountNotFoundError
> => {
  if (!accountId) {
    return okAsync(null)
  }
  return ResultAsync.fromPromise(
    stripe.accounts.retrieve(accountId),
    (error) => new StripeAccountError(String(error)),
  )
}
