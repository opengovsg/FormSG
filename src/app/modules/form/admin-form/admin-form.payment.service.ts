import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { PaymentsUpdateDto, PaymentType } from '../../../../../shared/types'
import { IEncryptedFormDocument } from '../../../../types'
import { paymentConfig } from '../../../config/features/payment.config'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../../core/core.errors'
import { InvalidPaymentAmountError } from '../../payments/payments.errors'
import { FormNotFoundError } from '../form.errors'

import { EncryptedFormModel, logger } from './admin-form.service'

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
  if (enabled && newPayments?.payment_type === PaymentType.Fixed) {
    const { amount_cents } = newPayments
    if (
      amount_cents > paymentConfig.maxPaymentAmountCents ||
      amount_cents < paymentConfig.minPaymentAmountCents
    ) {
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
