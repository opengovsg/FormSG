import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  PaymentsProductUpdateDto,
  PaymentsUpdateDto,
  PaymentType,
} from '../../../../../shared/types'
import {
  IEncryptedForm,
  IEncryptedFormDocument,
  IPopulatedEncryptedForm,
} from '../../../../types'
import { paymentConfig } from '../../../config/features/payment.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptedFormModel } from '../../../models/form.server.model'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../../core/core.errors'
import {
  InvalidPaymentAmountError,
  PaymentConfigurationError,
} from '../../payments/payments.errors'
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
 * @returns err()
 */
export const updatePayments = (
  formId: string,
  form: IPopulatedEncryptedForm,
  newPayments: PaymentsUpdateDto,
): ResultAsync<
  IEncryptedFormDocument['payments_field'],
  | PossibleDatabaseError
  | FormNotFoundError
  | InvalidPaymentAmountError
  | PaymentConfigurationError
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
    const minAmountCents =
      newPayments.global_min_amount_override ||
      paymentConfig.minPaymentAmountCents
    if (min_amount < minAmountCents) {
      return errAsync(new InvalidPaymentAmountError())
    }
    if (max_amount > paymentConfig.maxPaymentAmountCents) {
      return errAsync(new InvalidPaymentAmountError())
    }
  }

  if (((form as IEncryptedForm)?.emails || []).length !== 0) {
    return errAsync(
      new PaymentConfigurationError(
        'Cannot enable payment for form with emails',
      ),
    )
  }

  if (form.isSingleSubmission) {
    return errAsync(
      new PaymentConfigurationError(
        'Cannot enable payment for form with single submission per submitterId enabled',
      ),
    )
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
  for (const product of newProducts) {
    // treat as a single item purchase if multi_qty is false
    const qtyModifier = product.multi_qty ? product.max_qty : 1
    const maximumSelectableQtyCost = qtyModifier * product.amount_cents
    if (maximumSelectableQtyCost > paymentConfig.maxPaymentAmountCents) {
      return errAsync(
        new InvalidPaymentAmountError(
          'Item and Quantity exceeded limit. Either lower your quantity or lower payment amount.',
        ),
      )
    }
  }
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
