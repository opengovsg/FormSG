// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import cuid from 'cuid'
import get from 'lodash/get'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'
import isURL from 'validator/lib/isURL'

import { IPaymentSchema, IPopulatedEncryptedForm } from '../../../types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'
import { PendingSubmissionNotFoundError } from '../submission/submission.errors'

import {
  PaymentAlreadyConfirmedError,
  PaymentNotFoundError,
} from './payments.errors'
import * as PaymentsService from './payments.service'
import {
  ComputePaymentStateError,
  MalformedStripeChargeObjectError,
  StripeAccountError,
  StripeAccountNotFoundError,
  StripeFetchError,
  StripeMetadataPaymentIdInvalidError,
} from './stripe.errors'
import { computePaymentState, getRedirectUri } from './stripe.utils'

const logger = createLoggerWithLabel(module)
const Payment = getPaymentModel(mongoose)

/**
 * Helper function that confirms a pending submission for a Stripe payment form
 * if necessary (i.e. if a charge.succeeded event is received and the pending
 * submission is not yet confirmed).
 *
 * @param {Stripe.Event} event the new Stripe Event causing the operation to occur
 * @param {IPaymentSchema} payment the payment to be confirmed
 *
 * @returns ok(payment) if payment exists
 * @returns err(MalformedStripeChargeObjectError) if the shape of the charge object returned by Stripe does not have expected fields
 * @returns err(PaymentNotFoundError) if the payment document does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(StripeFetchError) if there was an error while calling Stripe API
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
const confirmStripePaymentPendingSubmission = (
  event: Stripe.Event,
  payment: IPaymentSchema,
): ResultAsync<
  IPaymentSchema,
  | MalformedStripeChargeObjectError
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | StripeFetchError
  | DatabaseError
> => {
  const logMeta = {
    action: 'confirmStripePaymentPendingSubmission',
    event,
    paymentId: payment.id,
  }

  // If the event type is charge.succeeded, and there is not already completed
  // payment metadata, we need to confirm the payment on our end.
  if (event.type === 'charge.succeeded' && !payment.completedPayment) {
    // Step 1. Obtain the metadata (i.e. receipt url from charge,
    // transaction fee from balance transaction)
    const charge = event.data.object as Stripe.Charge
    const receiptUrl = charge.receipt_url

    // Note that for paynow expired payments in test mode, Stripe returns
    // receipt_url with 'null' string
    if (!receiptUrl || !isURL(receiptUrl)) {
      logger.error({
        message: 'Failed to find valid receipt URL in Stripe charge object',
        meta: { ...logMeta, charge },
      })
      return errAsync(new MalformedStripeChargeObjectError())
    }

    if (!charge.balance_transaction) {
      logger.error({
        message:
          'Failed to find valid balance transaction id in Stripe charge object',
        meta: { ...logMeta, charge },
      })
      return errAsync(new MalformedStripeChargeObjectError())
    }

    return (
      ResultAsync.fromPromise(
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
            meta: logMeta,
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
        // Step 2: Update the payment object with the new completed payment metadata
        .andThen((transactionFee) =>
          PaymentsService.confirmPaymentPendingSubmission(
            payment.id,
            new Date(event.created),
            receiptUrl,
            transactionFee,
          ),
        )
    )
  }

  return okAsync(payment)
}

/**
 * Retrieves and updates payment document of the given paymentId with the event.
 * This is done within a single transaction, so that the information in the
 * document is always consistent.
 *
 * @param {Stripe.Metadata | null} metadata the metadata associated with the payment, from the Stripe Event
 * @param {Stripe.Event} event the new Stripe Event causing the update operation to occur
 *
 * @returns ok(payment) if payment exists
 * @returns err(EventMetadataPaymentIdInvalidError) if the payment id is not found in the event metadata or is found but an invalid BSON object id
 * @returns err(MalformedStripeChargeObjectError) if the shape of the charge object returned by Stripe does not have expected fields
 * @returns err(PaymentNotFoundError) if the payment document does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(StripeFetchError) if there was an error while calling Stripe API
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const processStripeEvent = (
  metadata: Stripe.Metadata | null,
  event: Stripe.Event,
): ResultAsync<
  void,
  | StripeMetadataPaymentIdInvalidError
  | MalformedStripeChargeObjectError
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | StripeFetchError
  | ComputePaymentStateError
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
    return errAsync(new StripeMetadataPaymentIdInvalidError())
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    logger.warn({
      message: 'Stripe metadata contains invalid paymentId',
      meta: { ...logMeta, paymentId },
    })
    return errAsync(new StripeMetadataPaymentIdInvalidError())
  }

  return ResultAsync.fromPromise(
    // Step 1: Get the payment. If the submission does not exist or the event
    // has been processed before, ignore the event.
    Payment.findById(paymentId),
    (error) => {
      logger.error({
        message: 'Error encountered while finding payment by id',
        meta: { ...logMeta, paymentId },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((payment) => {
    if (!payment) {
      logger.error({
        message: 'Payment not found for paymentId received in Stripe metadata',
        meta: { ...logMeta, paymentId },
      })
      return errAsync(new PaymentNotFoundError())
    }

    if (payment.webhookLog.some((e) => e.id === event.id)) {
      // Stop processing if we encounter a duplicate event. This may have
      // occurred due to various reasons (e.g. us timing out on Stripe, so
      // Stripe retried the webhook).
      logger.warn({
        message: 'Duplicate event received from Stripe webhook endpoint',
        meta: { ...logMeta, paymentId },
      })
      return okAsync(undefined)
    }

    // Step 2: Confirm the pending submission awaiting payment from Stripe
    return confirmStripePaymentPendingSubmission(event, payment)
      .andThen((payment) => {
        // Step 3: Process the event by injecting it into the webhook log and
        // recomputing the state based on the log.

        // We expect webhook arrays to be small (~10 entries max), so push and
        // sort is ok.
        payment.webhookLog.push(event)
        payment.webhookLog.sort((e1, e2) => e1.created - e2.created)

        return computePaymentState(payment.webhookLog).asyncAndThen(
          ({ status, chargeIdLatest }) => {
            payment.status = status
            payment.chargeIdLatest = chargeIdLatest
            return okAsync(payment)
          },
        )
      })
      .andThen((payment) =>
        ResultAsync.fromPromise(payment.save(), (error) => {
          logger.error({
            message: 'Error encountered while updating payment',
            meta: logMeta,
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        }),
      )
      .andThen(() => okAsync(undefined))
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
