import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { IPopulatedForm } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import * as PaymentService from './payments.service'
import {
  ChargeReceiptNotFoundError,
  PaymentIntentLatestChargeNotFoundError,
  StripeAccountError,
  StripeFetchError,
  SubmissionAndFormMismatchError,
} from './stripe.errors'

const logger = createLoggerWithLabel(module)

export const linkStripeAccountToForm = (form: IPopulatedForm) => {
  // Check if form already has account id
  if (form.payments?.target_account_id) {
    return okAsync(form.payments.target_account_id)
  }

  // No account id, create and inject into form
  return ResultAsync.fromPromise(
    stripe.accounts.create({ type: 'standard' }),
    (error) => {
      return new StripeAccountError(String(error))
    },
  )
    .andThen(({ id }) =>
      ResultAsync.fromPromise(form.addPaymentAccountId(id), (error) => {
        const errMsg = 'Failed to update payment account id'
        logger.error({
          message: errMsg,
          meta: {
            action: 'linkStripeAccountToForm',
            accountId: id,
          },
          error,
        })
        return new DatabaseError(errMsg)
      }),
    )
    .map((updatedForm) => updatedForm.payments.target_account_id)
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
      // Step 4: Retrieve paymentIntent object
      ResultAsync.fromPromise(
        stripe.paymentIntents.retrieve(payment.paymentIntentId),
        (error) => {
          return new StripeFetchError(String(error))
        },
      ),
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
    .andThen((paymentIntent) =>
      // Step 5: Retrieve charge object
      ResultAsync.fromPromise(
        stripe.charges.retrieve(String(paymentIntent.latest_charge)),
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
    })
}
