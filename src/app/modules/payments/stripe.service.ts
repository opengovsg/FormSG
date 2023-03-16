import cuid from 'cuid'
import get from 'lodash/get'
import merge from 'lodash/merge'
import mongoose, { ClientSession } from 'mongoose'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { Payment } from 'shared/types'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'

import { IPopulatedForm } from '../../../types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import getPaymentModel from '../../models/payment.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { ApplicationError, DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import { retrieveFormById } from '../form/form.service'
import { SubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import {
  PaymentNotFoundError,
  PaymentReceiptNotAvailableYet,
} from './payments.errors'
import { findPaymentBySubmissionId } from './payments.service'
import {
  ChargeReceiptNotFoundError,
  EventMetadataSubmissionIdInvalidError,
  EventMetadataSubmissionIdNotFoundError,
  PaymentIntentLatestChargeNotFoundError,
  StripeAccountError,
  StripeAccountNotFoundError,
  StripeFetchError,
  SubmissionAndFormMismatchError,
} from './stripe.errors'
import { computePaymentState, getRedirectUri } from './stripe.utils'

const logger = createLoggerWithLabel(module)
const PaymentModel = getPaymentModel(mongoose)

// Not exported, only used to pass exceptional control from the transaction
// function back to the caller which is responsible for aborting the transaction.
class DuplicateEventError extends ApplicationError {
  constructor(message = 'Duplicate event processed') {
    super(message)
  }
}

const updateEventLogBySubmissionIdTransaction = async (
  session: ClientSession,
  submissionId: string,
  event: Stripe.Event,
  update?: Partial<Payment>,
): Promise<void> => {
  // Step 1: Get the payment. If the submission does not exist or the event
  // has been processed before, ignore the event.
  let payment = await PaymentModel.findOne({ submissionId }, { session })
  if (!payment) {
    throw new PaymentNotFoundError()
  }

  if (payment.eventLog.some((e) => e.id === event.id)) {
    throw new DuplicateEventError()
  }

  // Step 2: Update the payment
  if (update) {
    payment = merge(payment, update)
  }

  // Inject the event into the correct position into the array. Order by
  // event creation time first, then the object creation time (if it exists).
  // We expect webhook arrays to be small (~10 entries max), so push and
  // sort is fine.
  payment.eventLog.push(event)
  payment.eventLog.sort((e1, e2) => {
    const e1ObjectCreated = get(e1.data.object, 'created')
    const e2ObjectCreated = get(e2.data.object, 'created')
    if (
      e1.created === e2.created &&
      typeof e1ObjectCreated === 'number' &&
      typeof e2ObjectCreated === 'number'
    ) {
      return e1ObjectCreated - e2ObjectCreated
    }
    return e1.created - e2.created
  })

  // Step 3: Recompute the payment state based on the event log.
  const state = computePaymentState(payment.eventLog)
  payment = merge(payment, state)

  await payment.save({ session })
}

/**
 * Retrieves and updates payment document of the given submissionId with the event
 * @param metadata the metadata associated with the payment, from the Stripe Event
 * @param event the new Stripe Event causing the update operation to occur
 * @param update list of fields to update
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const updateEventLogBySubmissionId = (
  metadata: Stripe.Metadata | null,
  event: Stripe.Event,
  update?: Partial<Payment>,
): ResultAsync<
  void,
  | EventMetadataSubmissionIdNotFoundError
  | EventMetadataSubmissionIdInvalidError
  | PaymentNotFoundError
  | DatabaseError
> => {
  const logMeta = {
    action: 'updateEventLogBySubmissionId',
    metadata,
    event,
    update,
  }

  const submissionId = get(metadata, 'submissionId')
  if (!submissionId) {
    logger.warn({
      message: 'Stripe event metadata does not contain submissionId',
      meta: logMeta,
    })
    return errAsync(new EventMetadataSubmissionIdNotFoundError())
  }

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    logger.warn({
      message: 'Stripe event metadata contains invalid submissionId',
      meta: logMeta,
    })
    return errAsync(new EventMetadataSubmissionIdInvalidError())
  }

  return ResultAsync.fromSafePromise(
    PaymentModel.startSession().then(async (session) => {
      let error
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
        })
        await updateEventLogBySubmissionIdTransaction(
          session,
          submissionId,
          event,
          update,
        )
        await session.commitTransaction()
      } catch (e) {
        error = e
        await session.abortTransaction()
      } finally {
        session.endSession()
      }
      return error
    }),
  ).andThen((error) => {
    // If no error, transaction was ok. If duplicate event, also ok.
    if (!error) return okAsync(undefined)
    if (error instanceof DuplicateEventError) return okAsync(undefined)

    // Handle actual error cases.
    if (error instanceof PaymentNotFoundError) {
      logger.error({
        message: 'Payment not found in database',
        meta: {
          submissionId,
          ...logMeta,
        },
        error,
      })
      return errAsync(new PaymentNotFoundError())
    }
    logger.error({
      message: 'Error updating payment in database',
      meta: {
        submissionId,
        ...logMeta,
      },
      error,
    })
    return errAsync(new DatabaseError(getMongoErrorMessage(error)))
  })
}

export const getStripeOauthUrl = (form: IPopulatedForm) => {
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
  form: IPopulatedForm,
  {
    accountId,
    publishableKey,
  }: {
    accountId: string
    publishableKey: string
  },
): ResultAsync<string, DatabaseError> => {
  // Check if form already has account id
  if (form.payments?.target_account_id) {
    return okAsync(form.payments.target_account_id)
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
  ).map((updatedForm) => updatedForm.payments.target_account_id)
}

export const unlinkStripeAccountFromForm = (form: IPopulatedForm) => {
  if (!form.payments?.target_account_id) {
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

export const getReceiptUrl = (
  formId: string,
  submissionId: string,
): ResultAsync<
  string,
  | FormNotFoundError
  | SubmissionNotFoundError
  | PaymentNotFoundError
  | PaymentReceiptNotAvailableYet
> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return errAsync(new SubmissionNotFoundError())
  }

  // Step 1: verify form submission exists
  const paymentPromise = PaymentModel.findBySubmissionId(submissionId)
  return ResultAsync.fromPromise(paymentPromise, (error) => {
    logger.error({
      message:
        'Error while finding submissionId from payment collection in database',
      meta: { action: 'getReceiptUrl', formId, submissionId },
      error,
    })
    return new PaymentNotFoundError()
  }).andThen((payment) => {
    if (payment) {
      if (payment.receiptUrl) {
        // Step 2: Verify submission id linked to the form is the same
        // as the submission id provided in the payment params
        logger.info({
          message: 'Verified payment and receipt_url exists',
          meta: {
            action: 'getReceiptURL',
            formId,
            submissionId,
          },
        })
        return okAsync(payment.receiptUrl)
      }
      logger.info({
        message: 'No receipt yet, but payment exist',
        meta: {
          action: 'getReceiptURL',
          formId,
          submissionId,
        },
      })
      return errAsync(new PaymentReceiptNotAvailableYet())
    }
    // TODO: refine into better type
    return errAsync(new PaymentNotFoundError())
  })
}

export const __getReceiptURL = (
  formId: string,
  submissionId: string,
): ResultAsync<
  string,
  | FormNotFoundError
  | SubmissionNotFoundError
  | SubmissionAndFormMismatchError
  | StripeFetchError
  | PaymentIntentLatestChargeNotFoundError
  | ChargeReceiptNotFoundError
> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return errAsync(new SubmissionNotFoundError())
  }

  // Step 1: verify form submission exists
  return SubmissionService.findSubmissionById(submissionId)
    .andThen((submission) => {
      // Step 2: Verify submission id linked to the form is the same
      // as the submission id provided in the payment params
      if (String(submission.form._id) === formId) {
        logger.info({
          message: 'Verified form submission exists',
          meta: {
            action: 'getReceiptURL',
            submission,
          },
        })
        return okAsync(submission)
      }
      return errAsync(new SubmissionAndFormMismatchError())
    })
    .andThen((submission) => {
      // Step 3: find payment id of form submission
      return findPaymentBySubmissionId(submission._id)
    })
    .andThen((payment) =>
      retrieveFormById(formId)
        .andThen((form) =>
          ResultAsync.fromPromise(
            // Step 4: Retrieve paymentIntent object
            stripe.paymentIntents.retrieve(payment.paymentIntentId, undefined, {
              stripeAccount: form.payments?.target_account_id,
            }),
            (error) => {
              return new StripeFetchError(String(error))
            },
          )
            .andThen((paymentIntent) => {
              logger.info({
                message: 'Retrieved payment intent object from Stripe',
                meta: {
                  action: 'getReceiptURL',
                  paymentIntent,
                },
              })
              if (paymentIntent.latest_charge) {
                logger.info({
                  message:
                    "Successfully retrieved payment intent's latest charge from Stripe",
                  meta: {
                    action: 'getReceiptURL',
                    paymentIntent,
                  },
                })
                return okAsync(paymentIntent)
              }
              return errAsync(new PaymentIntentLatestChargeNotFoundError())
            })
            .map((paymentIntent) => ({
              paymentIntent,
              stripeAccount: form.payments?.target_account_id,
            })),
        )
        .andThen(({ paymentIntent, stripeAccount }) =>
          // Step 5: Retrieve charge object
          ResultAsync.fromPromise(
            stripe.charges.retrieve(
              String(paymentIntent.latest_charge),
              undefined,
              { stripeAccount },
            ),
            (error) => {
              return new StripeFetchError(String(error))
            },
          ),
        )
        .andThen((charge) => {
          // Step 6: Retrieve receipt url
          // Note that for paynow expired payments in test mode, stripe returns receipt_url with 'null' string
          if (!charge || !charge.receipt_url || charge.receipt_url === 'null') {
            return errAsync(new ChargeReceiptNotFoundError())
          }
          logger.info({
            message: 'Retrieved charge object from Stripe',
            meta: {
              action: 'getReceiptURL',
              charge,
            },
          })
          return okAsync(String(charge.receipt_url))
        }),
    )
}
