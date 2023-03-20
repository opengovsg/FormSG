import cuid from 'cuid'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'

import { FormResponseMode } from '../../../../shared/types'
import { IPopulatedEncryptedForm } from '../../../types'
import config from '../../config/config'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import { retrieveFormById } from '../form/form.service'
import { isFormEncryptMode } from '../form/form.utils'
import {
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import * as PaymentService from './payments.service'
import { getRedirectUri } from './payments.utils'
import {
  ChargeReceiptNotFoundError,
  PaymentIntentLatestChargeNotFoundError,
  StripeAccountError,
  StripeAccountNotFoundError,
  StripeFetchError,
  SubmissionAndFormMismatchError,
} from './stripe.errors'

const logger = createLoggerWithLabel(module)

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

export const getReceiptURL = (
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
      return PaymentService.findPaymentBySubmissionId(submission._id)
    })
    .andThen((payment) =>
      retrieveFormById(formId)
        .andThen((form) => {
          return isFormEncryptMode(form)
            ? ok(form)
            : err(
                new ResponseModeError(
                  FormResponseMode.Encrypt,
                  form.responseMode,
                ),
              )
        })
        .andThen((form) =>
          ResultAsync.fromPromise(
            // Step 4: Retrieve paymentIntent object
            stripe.paymentIntents.retrieve(payment.paymentIntentId, undefined, {
              stripeAccount: form.payments_channel?.target_account_id,
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
              stripeAccount: form.payments_channel?.target_account_id,
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
