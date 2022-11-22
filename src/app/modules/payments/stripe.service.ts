import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { stripe } from '../../loaders/stripe'
import { FormNotFoundError } from '../form/form.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'
import * as SubmissionService from '../submission/submission.service'

import * as PaymentService from './payments.service'
import {
  ChargeReceiptNotFoundError,
  PaymentIntentLatestChargeNotFoundError,
  StripeFetchError,
  SubmissionAndFormMismatchError,
} from './stripe.errors'

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
      if (submission.form._id === formId) return okAsync(submission)
      return errAsync(new SubmissionAndFormMismatchError())
    })
    .andThen((submission) => {
      // Step 3: find payment id of form submission
      return PaymentService.findPaymentBySubmissionId(
        String(submission.paymentId),
      )
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
      if (paymentIntent.latest_charge) return okAsync(paymentIntent)
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
      if (!charge) {
        return errAsync(new ChargeReceiptNotFoundError())
      }
      return okAsync(String(charge.receipt_url))
    })
}
