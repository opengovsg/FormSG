// Use 'stripe-event-types' for better type discrimination.
/// <reference types="stripe-event-types" />
import cuid from 'cuid'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'
import isURL from 'validator/lib/isURL'

import { featureFlags } from '../../../../shared/constants'
import {
  EmailFieldBase,
  PaymentStatus,
  ReconciliationReportLine,
} from '../../../../shared/types'
import {
  IEncryptedFormSchema,
  IPaymentSchema,
  IPopulatedEncryptedForm,
} from '../../../types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../utils/handle-mongo-error'
import { InvalidDomainError } from '../auth/auth.errors'
import * as AuthService from '../auth/auth.service'
import { DatabaseError, DatabaseWriteConflictError } from '../core/core.errors'
import { getFeatureFlag } from '../feature-flags/feature-flags.service'
import { FormNotFoundError } from '../form/form.errors'
import {
  PendingSubmissionNotFoundError,
  SubmissionNotFoundError,
} from '../submission/submission.errors'

import {
  ConfirmedPaymentNotFoundError,
  PaymentAlreadyConfirmedError,
  PaymentNotFoundError,
} from './payments.errors'
import * as PaymentsService from './payments.service'
import {
  ComputePaymentStateError,
  MalformedStripeChargeObjectError,
  MalformedStripeEventObjectError,
  StripeAccountError,
  StripeFetchError,
  StripeMetadataIncorrectEnvError,
  StripeMetadataInvalidError,
  StripeMetadataValidPaymentIdNotFoundError,
} from './stripe.errors'
import {
  computePaymentState,
  computePayoutDetails,
  getChargeIdFromNestedCharge,
  getMetadataPaymentId,
} from './stripe.utils'

const logger = createLoggerWithLabel(module)

/**
 * Retrieves charge object from Stripe when given the charge ID.
 * @param {string} chargeId the charge id of to be retrieved
 * @param {string} stripeAccount optional; the Stripe account id the charge belongs to
 * @returns ok(charge) if charge exists
 * @returns err(StripeFetchError) if an error occurred while retrieving the charge
 */
export const getStripeChargeById = (
  chargeId: string,
  stripeAccount?: string,
): ResultAsync<Stripe.Charge, StripeFetchError> => {
  return ResultAsync.fromPromise(
    stripe.charges.retrieve(chargeId, { stripeAccount }),
    (error) => {
      logger.error({
        message: 'Error while retrieving Stripe charge by id',
        meta: {
          action: 'getStripeChargeById',
          chargeId,
          stripeAccount,
        },
        error,
      })
      return new StripeFetchError()
    },
  )
}

/**
 * Helper function that confirms a pending submission for a Stripe payment form
 * if necessary (i.e. if a charge.succeeded event is received and the pending
 * submission is not yet confirmed).
 *
 * @param {Stripe.Event} event the new Stripe Event causing the operation to occur
 * @param {IPaymentSchema} payment the payment to be confirmed
 * @param {mongoose.ClientSession} session the mongoose session to use for all db operations
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
  session: mongoose.ClientSession,
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
          ? stripe.balanceTransactions.retrieve(charge.balance_transaction, {
              stripeAccount: event.account,
            })
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
        // Step 2: Update the payment object with the new completed payment metadata
        .andThen((balanceTransaction) =>
          PaymentsService.confirmPaymentPendingSubmission(
            payment,
            new Date(event.created * 1000), // Convert to miliseconds from epoch
            receiptUrl,
            balanceTransaction.fee,
            session,
          ),
        )
    )
  }

  return okAsync(payment)
}

/**
 * Retrieves and updates payment document of the given paymentId with the event.
 * NOTE: This is exported only for testing
 *
 * @param {string} paymentId the payment id to be updated
 * @param {Stripe.Event} event the new Stripe Event causing the update operation to occur
 * @param {mongoose.ClientSession} session the mongoose session to use for all db operations
 *
 * @returns ok() if event was successfully processed
 * @returns err(MalformedStripeEventObjectError) if the shape of the event object received from Stripe does not have expected fields
 * @returns err(MalformedStripeChargeObjectError) if the shape of the charge object returned by Stripe does not have expected fields
 * @returns err(PaymentNotFoundError) if the payment document does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(StripeFetchError) if there was an error while calling Stripe API
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const processStripeEventWithinSession = (
  paymentId: string,
  event: Stripe.Event,
  session: mongoose.ClientSession,
): ResultAsync<
  void,
  | MalformedStripeEventObjectError
  | MalformedStripeChargeObjectError
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | StripeFetchError
  | ComputePaymentStateError
  | DatabaseError
> => {
  const logMeta = {
    action: 'processStripeEventWithinSession',
    paymentId,
    event,
  }

  // Step 1a: Get the payment.
  return PaymentsService.findPaymentById(paymentId, session).andThen(
    (payment) => {
      // Step 1b: If the submission does not exist or the event has been processed
      // before, ignore the event.
      if (!payment) {
        logger.error({
          message:
            'Payment not found for paymentId received in Stripe metadata',
          meta: logMeta,
        })
        return errAsync(new PaymentNotFoundError())
      }

      if (payment.webhookLog.some((e) => e.id === event.id)) {
        // Stop processing if we encounter a duplicate event. This may have
        // occurred due to various reasons (e.g. us timing out on Stripe, so
        // Stripe retried the webhook).
        logger.warn({
          message: 'Duplicate event received by Stripe event handler',
          meta: logMeta,
        })
        return okAsync(undefined)
      }

      if (payment.targetAccountId !== event.account) {
        // Reject the event if the accounts do not match up. Should never happen!
        logger.error({
          message:
            'Received Stripe event with different target account id from related payment',
          meta: { ...logMeta, targetAccountId: payment.targetAccountId },
        })
        return errAsync(new MalformedStripeEventObjectError())
      }

      // Step 2: Confirm the pending submission awaiting payment from Stripe
      return (
        confirmStripePaymentPendingSubmission(event, payment, session)
          // Step 3: Inject the event into the webhook log.
          .andThen((payment) => {
            // We expect webhook arrays to be small (~10 entries max), so push and
            // sort is ok.
            payment.webhookLog.push(event)
            payment.webhookLog.sort((e1, e2) => e1.created - e2.created)
            return ok(payment)
          })
          // Step 4. Compute the payment state
          .andThen((payment) =>
            computePaymentState(payment.webhookLog).asyncAndThen(
              ({ status, chargeIdLatest }) => {
                payment.status = status
                payment.chargeIdLatest = chargeIdLatest
                return okAsync(payment)
              },
            ),
          )
          // Step 5. Compute the payout state
          .andThen((payment) =>
            computePayoutDetails(payment.webhookLog).asyncAndThen((payout) => {
              payment.payout = payout
              return okAsync(payment)
            }),
          )
          // Step 6. Save the payment document
          .andThen((payment) =>
            ResultAsync.fromPromise(payment.save({ session }), (error) => {
              const mongoError = transformMongoError(error)
              if (mongoError instanceof DatabaseWriteConflictError) {
                logger.error({
                  message:
                    'Write conflict error encountered while updating payment',
                  meta: logMeta,
                  error,
                })
                // Directly throw write conflict errors to enable mongo transaction retries
                // eslint-disable-next-line typesafe/no-throw-sync-func
                throw error
              }

              logger.error({
                message: 'Error encountered while updating payment',
                meta: logMeta,
                error,
              })
              return new DatabaseError(getMongoErrorMessage(error))
            }),
          )
          .andThen(() => okAsync(undefined))
      )
    },
  )
}

/**
 * Retrieves and updates payment document of the given paymentId with the event.
 * This is done within a single transaction, so that the information in the
 * document is always consistent.
 *
 * @param {string} paymentId the payment id to be updated
 * @param {Stripe.Event} event the new Stripe Event causing the update operation to occur
 *
 * @returns ok() if event was successfully processed
 * @returns err(MalformedStripeEventObjectError) if the shape of the event object received from Stripe does not have expected fields
 * @returns err(MalformedStripeChargeObjectError) if the shape of the charge object returned by Stripe does not have expected fields
 * @returns err(PaymentNotFoundError) if the payment document does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(StripeFetchError) if there was an error while calling Stripe API
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const processStripeEvent = (
  paymentId: string,
  event: Stripe.Event,
): ResultAsync<
  void,
  | MalformedStripeEventObjectError
  | MalformedStripeChargeObjectError
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | StripeFetchError
  | ComputePaymentStateError
  | DatabaseError
> => {
  const logMeta = {
    action: 'processStripeEvent',
    paymentId,
    event,
  }

  // Step 0: Set up the session and start the transaction
  return ResultAsync.fromPromise(mongoose.startSession(), (error) => {
    logger.error({
      message: 'Database error while starting mongoose session',
      meta: logMeta,
      error,
    })
    return new DatabaseError(getMongoErrorMessage(error))
  }).andThen((session) =>
    ResultAsync.fromPromise(
      session.withTransaction(
        () =>
          // Since withTransaction uses throw-catch to determine whether to
          // commit or abort, need to map out of neverthrow
          processStripeEventWithinSession(paymentId, event, session).match(
            () => {
              return
            },
            (err) => {
              // Throw all application errors to trigger an abort.
              // eslint-disable-next-line typesafe/no-throw-sync-func
              throw err
            },
          ),
        {
          readPreference: 'primary',
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        },
      ),
      (error) => {
        // Catch application errors and return them directly
        logger.error({
          message: 'Error occurred in transaction to process Stripe webhook',
          meta: logMeta,
          error,
        })
        return error as never
      },
    )
      .andThen(() => {
        void session.endSession()
        return okAsync(undefined)
      })
      .orElse((err) => {
        void session.endSession()
        return errAsync(err)
      }),
  )
}

type HandleStripeEventResultError =
  | StripeMetadataInvalidError
  | StripeMetadataValidPaymentIdNotFoundError
  | StripeMetadataIncorrectEnvError
  | MalformedStripeEventObjectError
  | MalformedStripeChargeObjectError
  | PaymentNotFoundError
  | PendingSubmissionNotFoundError
  | PaymentAlreadyConfirmedError
  | StripeFetchError
  | ComputePaymentStateError
  | ConfirmedPaymentNotFoundError
  | SubmissionNotFoundError
  | FormNotFoundError
  | DatabaseError

/**
 * Processes an incoming Stripe event.
 *
 * @param {Stripe.Event} event the new Stripe event to be processed
 *
 * @returns ok() if event was successfully processed
 * @returns err(MalformedStripeEventObjectError) if the shape of the event object received from Stripe does not have expected fields
 * @returns err(MalformedStripeChargeObjectError) if the shape of the charge object returned by Stripe does not have expected fields
 * @returns err(PaymentNotFoundError) if the payment document does not exist
 * @returns err(PendingSubmissionNotFoundError) if the pending submission being referenced by the payment document does not exist
 * @returns err(PaymentAlreadyConfirmedError) if the payment document already has an associated completed payment
 * @returns err(StripeFetchError) if there was an error while calling Stripe API
 * @returns err(ComputePaymentStateError) if there was an error while recomputing the payment state
 * @returns err(StripeMetadataInvalidError) if the metadata has an invalid shape
 * @returns err(StripeMetadataValidPaymentIdNotFoundError) if the payment id was not found or is an invalid BSON object id
 * @returns err(StripeMetadataIncorrectEnvError) if the app is incorrect
 * @returns err(ConfirmedPaymentNotFoundError) if the paymentId does not have a submission ID associated with a completed payment
 * @returns err(SubmissionNotFoundError) if submission does not exist in the database
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const handleStripeEvent = (
  event: Stripe.DiscriminatedEvent,
): ResultAsync<void, HandleStripeEventResultError> => {
  const logMeta = {
    action: 'handleStripeEvent',
    event,
  }

  let result: ResultAsync<void, HandleStripeEventResultError> =
    okAsync(undefined)

  switch (event.type) {
    // We catch all payment_intent, charge and payout events, except the
    // following ignored event types (as associated features are not supported):
    // - charge.captured, charge.expired (only for capture flow)
    // - charge.updated (descriptions or metadata are updated)
    // - payment_intent.amount_capturable_updated (only for capture flow)
    // - payment_intent.partially_funded (only occurs when payment intents are
    //   completed in part by customer stripe account balance)
    case 'payment_intent.canceled':
    case 'payment_intent.created':
    case 'payment_intent.payment_failed':
    case 'payment_intent.processing':
    case 'payment_intent.requires_action':
    case 'payment_intent.succeeded':
    case 'charge.failed':
    case 'charge.pending':
    case 'charge.refunded':
    case 'charge.succeeded': {
      result = getMetadataPaymentId(event.data.object.metadata).asyncAndThen(
        (paymentId) =>
          processStripeEvent(paymentId, event).andThen(() => {
            if (event.type !== 'charge.succeeded') return okAsync(undefined)

            return PaymentsService.performPaymentPostSubmissionActions(
              paymentId,
            )
              .andThen(() => okAsync(undefined))
              .orElse((e) => {
                logger.warn({
                  message: 'Payment confirmation email not sent',
                  meta: logMeta,
                })
                return errAsync(e)
              })
          }),
      )
      break
    }
    case 'charge.dispute.closed':
    case 'charge.dispute.created':
    case 'charge.dispute.funds_reinstated':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.updated': {
      const chargeIdLatest = getChargeIdFromNestedCharge(
        event.data.object.charge,
      )

      result = getStripeChargeById(chargeIdLatest, event.account)
        .andThen((charge) => getMetadataPaymentId(charge.metadata))
        .mapErr((error) => {
          if (error instanceof PaymentNotFoundError) {
            logger.warn({
              message: 'Received dispute event with unknown latest charge id',
              meta: { ...logMeta, chargeIdLatest },
            })
          }
          return error
        })
        .andThen((paymentId) => processStripeEvent(paymentId, event))
      break
    }
    case 'charge.refund.updated': {
      if (!event.data.object.charge) {
        logger.warn({
          message: 'Received Stripe event charge.refund.updated with no charge',
          meta: { ...logMeta, chargeIdLatest: event.data.object.charge },
        })
        result = errAsync(new PaymentNotFoundError())
        break
      }

      const chargeIdLatest = getChargeIdFromNestedCharge(
        event.data.object.charge,
      )

      result = getStripeChargeById(chargeIdLatest, event.account)
        .andThen((charge) => getMetadataPaymentId(charge.metadata))
        .mapErr((error) => {
          if (error instanceof PaymentNotFoundError) {
            logger.warn({
              message:
                'Received refund updated event with unknown latest charge id',
              meta: { ...logMeta, chargeIdLatest },
            })
          }
          return error
        })
        .andThen((paymentId) => processStripeEvent(paymentId, event))
      break
    }
    case 'payout.canceled':
    case 'payout.created':
    case 'payout.failed':
    case 'payout.paid':
    case 'payout.updated':
    case 'payout.reconciliation_completed': {
      // Retrieve the list of balance transactions related to this payout, and
      // associate the payout with the set of charges it pays out for
      let payoutProcessError: ResultAsync<void, HandleStripeEventResultError> =
        okAsync(undefined)
      result = ResultAsync.fromPromise(
        stripe.balanceTransactions
          .list(
            { payout: event.data.object.id, expand: ['data.source'] },
            { stripeAccount: event.account },
          )
          .autoPagingEach(async (balanceTransaction) => {
            if (!['charge', 'payment'].includes(balanceTransaction.type)) return

            const charge = balanceTransaction.source as Stripe.Charge
            await getMetadataPaymentId(charge.metadata)
              .asyncAndThen((paymentId) => processStripeEvent(paymentId, event))
              .mapErr((error) => {
                logger.error({
                  message:
                    'Error when calling processStripeEvent while paging through balanceTransaction',
                  meta: { ...logMeta, chargeId: charge },
                  error,
                })
                // Reducer to keep errors around
                payoutProcessError = errAsync(error)
                return
              })

            return
          }),
        (error) => {
          if (error instanceof Stripe.errors.StripeInvalidRequestError) {
            // In the case that Stripe re-issues an invalid request error, it is
            // likely due to incorrect environment. Ignore this specific error
            // and move on with life.
            logger.warn({
              message:
                'Stripe invalid request error while processing Stripe payout event',
              meta: logMeta,
              error,
            })
            return new StripeMetadataIncorrectEnvError()
          }

          logger.error({
            message: 'Error while processing Stripe payout event',
            meta: logMeta,
            error,
          })
          return new StripeFetchError()
        },
      ).andThen(() => payoutProcessError)
      break
    }
    default:
      // Ignore all other events
      logger.warn({
        message: 'Received Stripe event with unknown event.type',
        meta: logMeta,
      })
      break
  }

  return result
}

export const getStripeOauthUrl = (form: IPopulatedEncryptedForm) => {
  const state = `${form._id}.${cuid()}`

  return ok({
    authUrl: stripe.oauth.authorizeUrl({
      client_id: paymentConfig.stripeClientID,
      response_type: 'code',
      scope: 'read_write',
      state,
      redirect_uri: `${config.app.appUrl}/api/v3/payments/stripe/callback`,
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
): ResultAsync<
  string,
  DatabaseError | StripeFetchError | StripeAccountError | InvalidDomainError
> => {
  const logMeta = {
    action: 'linkStripeAccountToForm',
    stripeAccountId: accountId,
    stripePublishableKey: publishableKey,
    formId: form._id,
  }

  const hasEmailFieldWithFormSummary = form.form_fields
    .filter((field) => field.fieldType === 'email')
    .map((field) => field as EmailFieldBase)
    .map((field) => field.autoReplyOptions.includeFormSummary)
    .some((x) => x)

  if (hasEmailFieldWithFormSummary) {
    return errAsync(
      new StripeAccountError('Email fields with pdf summary is not allowed'),
    )
  }

  return getFeatureFlag(featureFlags.validateStripeEmailDomain, {
    // If getFeatureFlag throws a DatabaseError, we want to log it, but respond
    // to the client as if the flag is not found.
    fallbackValue: false,
    logMeta,
  })
    .andThen((shouldValidateStripeEmailDomain) => {
      if (!shouldValidateStripeEmailDomain) {
        // skip validation
        return okAsync(undefined)
      }

      return ResultAsync.fromPromise(
        stripe.accounts.retrieve(accountId),
        (error) => {
          logger.error({
            message: 'Error retriving Stripe account',
            meta: {
              action: 'linkStripeAccountToForm',
              stripeAccountId: accountId,
            },
            error,
          })
          return new StripeFetchError(String(error))
        },
      ).andThen((account) => {
        // Check if the email domain is whitelisted
        if (!account.email) {
          logger.error({
            message: 'Error retriving Stripe account email',
            meta: {
              action: 'linkStripeAccountToForm',
              stripeAccountId: accountId,
              account,
            },
          })
          return errAsync(
            new StripeAccountError('Stripe account email is missing'),
          )
        }
        return AuthService.validateEmailDomain(account.email)
      })
    })
    .andThen(() =>
      ResultAsync.fromPromise(
        form.addPaymentAccountId({ accountId, publishableKey }),
        (error) => {
          const errMsg = 'Failed to update payment account id'
          logger.error({
            message: errMsg,
            meta: logMeta,
            error,
          })
          return new DatabaseError(errMsg)
        },
      ).map((updatedForm) => updatedForm.payments_channel.target_account_id),
    )
}

export const unlinkStripeAccountFromForm = (
  form: IPopulatedEncryptedForm,
): ResultAsync<IEncryptedFormSchema, DatabaseError> =>
  ResultAsync.fromPromise(form.removePaymentAccount(), (error) => {
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

export const createAccountLink = (
  accountId: string,
  redirectFormId: string,
): ResultAsync<Stripe.Response<Stripe.AccountLink>, StripeAccountError> => {
  return ResultAsync.fromPromise(
    stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${config.app.appUrl}/admin/form/${redirectFormId}/settings/payments`,
      return_url: `${config.app.appUrl}/admin/form/${redirectFormId}/settings/payments`,
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
): ResultAsync<Stripe.Response<Stripe.Account> | null, StripeAccountError> => {
  if (!accountId) {
    return okAsync(null)
  }
  return ResultAsync.fromPromise(
    stripe.accounts.retrieve(accountId),
    (error) => new StripeAccountError(String(error)),
  )
}

/**
 * Service to interface with Stripe to get all undelivered events for a
 * specified Stripe account.
 *
 * @param {string} stripeAccount the Stripe account id to retrieve events for
 * @param {number} maxAgeHrs (optional) the max age of events to attempt reconciliation for, in hours before now; if omitted, it is treated as infinite
 *
 * @returns forEach, which takes a callback that is run for each retrieved event
 */
export const getUndeliveredStripeEventsForAccount = (
  stripeAccount: string,
  maxAgeHrs?: number,
) => {
  const SECONDS_PER_HOUR = 60 * 60
  return {
    forEach: (
      cb: (event: Stripe.Event) => boolean | void | Promise<boolean | void>,
    ) =>
      ResultAsync.fromPromise(
        stripe.events
          .list(
            {
              created: maxAgeHrs
                ? {
                    gte:
                      Math.trunc(Date.now() / 1000) -
                      maxAgeHrs * SECONDS_PER_HOUR,
                  }
                : undefined,
              delivery_success: false,
            },
            { stripeAccount },
          )
          .autoPagingEach(cb),
        (error) => {
          logger.error({
            message: 'Error while processing Stripe events for account',
            meta: {
              action: 'getUndeliveredStripeEventsForAccount',
              stripeAccount,
              error,
            },
          })
          return new StripeFetchError(String(error))
        },
      ),
  }
}

/**
 * Function that cross-validates payment statuses between Stripe and our database.
 *
 * @param {string} paymentId the payment id to check
 *
 * @returns ok(ReconciliationReport) if no errors are thrown while matching payment statuses
 * @returns err(StripeFetchError) if an error is thrown while calling Stripe API
 */
export const verifyPaymentStatusWithStripe = (
  paymentId: string,
): ResultAsync<ReconciliationReportLine, StripeFetchError> => {
  const logMeta = {
    action: 'verifyPaymentStatusWithStripe',
    paymentId,
  }

  return PaymentsService.findPaymentById(paymentId)
    .andThen((payment) =>
      ResultAsync.fromPromise(
        stripe.paymentIntents.retrieve(payment.paymentIntentId, {
          stripeAccount: payment.targetAccountId,
        }),
        (error) => {
          logger.error({
            message: 'Error while retrieving payment intent',
            meta: {
              ...logMeta,
              paymentIntentId: payment.paymentIntentId,
            },
            error,
          })
          return new StripeFetchError(String(error))
        },
      ).andThen((paymentIntent) => okAsync({ payment, paymentIntent })),
    )
    .andThen(({ payment, paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_capture':
        case 'requires_action': {
          const isPaymentStatusIncomplete = [
            PaymentStatus.Pending,
            PaymentStatus.Failed,
          ].includes(payment.status)

          if (!isPaymentStatusIncomplete) {
            // If the payment is in a completed state, something is wrong!
            logger.error({
              message:
                'Payment state mismatch found (Stripe incomplete, FormSG complete)',
              meta: { ...logMeta, payment, paymentIntent },
            })
            return okAsync({
              payment,
              paymentIntent,
              mismatch: true,
              canceled: false,
            })
          }

          // Payment is still incomplete on our end. Check the age, and cancel
          // if it is stale (> 30 min old).
          const paymentAgeInSeconds =
            Math.trunc(Date.now() / 1000) - paymentIntent.created
          // TODO: Extract payment stale time into env var
          const paymentStaleTimeInSeconds = 1800 /* = 30 min * 60 sec/min */

          if (paymentAgeInSeconds > paymentStaleTimeInSeconds) {
            return ResultAsync.fromPromise(
              stripe.paymentIntents.cancel(paymentIntent.id, {
                stripeAccount: payment.targetAccountId,
              }),
              (error) => {
                logger.error({
                  message: 'Error while canceling stale payment intent',
                  meta: { ...logMeta, payment, paymentIntent },
                  error,
                })
                return new StripeFetchError(String(error))
              },
            ).andThen(() =>
              okAsync({
                payment,
                paymentIntent,
                mismatch: false,
                canceled: true,
              }),
            )
          }
          return okAsync({
            payment,
            paymentIntent,
            mismatch: false,
            canceled: false,
          })
        }
        case 'succeeded': {
          const isPaymentStatusComplete = [
            PaymentStatus.Succeeded,
            PaymentStatus.PartiallyRefunded,
            PaymentStatus.FullyRefunded,
            PaymentStatus.Disputed,
          ].includes(payment.status)

          if (!isPaymentStatusComplete) {
            //!! This is the case we are worried about !!
            // On Stripe, the payment might be complete but FormSG does not know
            // even after reconciliation.
            logger.error({
              message:
                'Payment state mismatch found (Stripe complete, FormSG incomplete)',
              meta: { ...logMeta, payment, paymentIntent },
            })
            return okAsync({
              payment,
              paymentIntent,
              mismatch: true,
              canceled: false,
            })
          }
          return okAsync({
            payment,
            paymentIntent,
            mismatch: false,
            canceled: false,
          })
        }
        case 'canceled':
          if (payment.status !== PaymentStatus.Canceled) {
            logger.error({
              message:
                'Payment state mismatch found (Stripe canceled, FormSG not canceled)',
              meta: { ...logMeta, payment, paymentIntent },
            })
            return okAsync({
              payment,
              paymentIntent,
              mismatch: true,
              canceled: false,
            })
          }
          return okAsync({
            payment,
            paymentIntent,
            mismatch: false,
            canceled: false,
          })
        default:
          // 'processing' is a limbo state, do nothing.
          return okAsync({
            payment,
            paymentIntent,
            mismatch: false,
            canceled: false,
          })
      }
    })
}
