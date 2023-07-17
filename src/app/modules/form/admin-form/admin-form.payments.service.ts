import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  PaymentsProductUpdateDto,
  PaymentsUpdateDto,
  PaymentType,
} from '../../../../../shared/types'
import { IEncryptedFormDocument } from '../../../../types'
import { paymentConfig } from '../../../config/features/payment.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptedFormModel } from '../../../models/form.server.model'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../../core/core.errors'
import { InvalidPaymentAmountError } from '../../payments/payments.errors'
import { FormNotFoundError } from '../form.errors'

const logger = createLoggerWithLabel(module)
const EncryptedFormModel = getEncryptedFormModel(mongoose)

/**
 * Update the payments field of the given form
 * @param formId the id of the form to update the end page for
 * @param newPayments the new payments field to replace the current one
 * @returns ok(updated payments object) when update is successful
 * @returns err(FormNotFoundError) if form cannot be found
 * @returns err(PossibleDatabaseError) if start page update fails
 * @returns err(InvalidPaymentAmountError) if payment amount exceeds MAX_PAYMENT_AMOUNT
 */
export const updatePayments = (
  formId: string,
  newPayments: PaymentsUpdateDto,
): ResultAsync<
  IEncryptedFormDocument['payments_field'],
  PossibleDatabaseError | FormNotFoundError | InvalidPaymentAmountError
> => {
  const { enabled } = newPayments

  // Check if payment amount exceeds maxPaymentAmountCents or below minPaymentAmountCents if the payment is enabled
  if (enabled && newPayments.payment_type === PaymentType.Fixed) {
    const { amount_cents } = newPayments
    if (
      amount_cents > paymentConfig.maxPaymentAmountCents ||
      amount_cents < paymentConfig.minPaymentAmountCents
    ) {
      return errAsync(new InvalidPaymentAmountError())
    }
  }

  if (enabled && newPayments.payment_type === PaymentType.Variable) {
    const { min_amount, max_amount } = newPayments
    if (min_amount > max_amount) {
      return errAsync(new InvalidPaymentAmountError())
    }
    if (min_amount < paymentConfig.minPaymentAmountCents) {
      return errAsync(new InvalidPaymentAmountError())
    }
    if (max_amount > paymentConfig.maxPaymentAmountCents) {
      return errAsync(new InvalidPaymentAmountError())
    }
  }

  return ResultAsync.fromPromise(
    EncryptedFormModel.updatePaymentsById(formId, newPayments),
    (error) => {
      logger.error({
        message: 'Error occurred when updating form payments',
        meta: {
          action: 'updatePayments',
          formId,
          newPayments,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((updatedForm) => {
    if (!updatedForm) {
      return errAsync(new FormNotFoundError())
    }
    return okAsync(updatedForm.payments_field)
  })
}

export const getPaymentGuideLink = (): string => {
  return paymentConfig.guideLink
}

/**
 * Update the payments of the given form
 * @param formId the id of the form to update the end page for
 * @param newStartPage the new start page object to replace the current one
 * @returns ok(updated start page object) when update is successful
 * @returns err(FormNotFoundError) if form cannot be found
 * @returns err(PossibleDatabaseError) if start page update fails
 * @returns err(InvalidPaymentAmountError) if payment amount exceeds MAX_PAYMENT_AMOUNT
 */
export const updatePaymentsProduct = (
  formId: string,
  newProducts: PaymentsProductUpdateDto,
): ResultAsync<
  IEncryptedFormDocument['payments_field'],
  PossibleDatabaseError | FormNotFoundError | InvalidPaymentAmountError
> => {
  // TODO: should ensure if amounts_cents is within range for array
  // const { enabled, amount_cents } = newProducts

  // // Check if payment amount exceeds maxPaymentAmountCents or below minPaymentAmountCents if the payment is enabled
  // if (enabled && amount_cents !== undefined) {
  //   if (
  //     amount_cents > paymentConfig.maxPaymentAmountCents ||
  //     amount_cents < paymentConfig.minPaymentAmountCents
  //   ) {
  //     return errAsync(new InvalidPaymentAmountError())
  //   }
  // }

  return ResultAsync.fromPromise(
    EncryptedFormModel.updatePaymentsProductById(formId, newProducts),
    (error) => {
      logger.error({
        message: 'Error occurred when updating form payments',
        meta: {
          action: 'updatePaymentsProduct',
          formId,
          newProducts,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((updatedForm) => {
    if (!updatedForm) {
      return errAsync(new FormNotFoundError())
    }
    return okAsync(updatedForm.payments_field)
  })
}
