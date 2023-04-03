import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

import { ApiService } from '~services/ApiService'

/**
 * Obtain payment receipt status for a given submission.
 * @param formId the id of the form
 * @param paymentId the id of the payment submission
 * @returns PaymentReceiptStatusDto on success
 */
export const getPaymentReceiptStatus = async (
  formId: string,
  paymentId: string,
): Promise<PaymentReceiptStatusDto> => {
  return ApiService.get<PaymentReceiptStatusDto>(
    `payments/receipt/${formId}/${paymentId}/status`,
  ).then(({ data }) => data)
}

/**
 * Obtain payment information neccessary to do a subsequent
 * for a given paymentId.
 * @param formId the id of the form
 * @param submissionId the id of the payment submission
 * @returns PaymentReceiptStatusDto on success
 */
export const getPaymentInfo = async (paymentId: string) => {
  return ApiService.get<GetPaymentInfoDto>(
    `payments/${paymentId}/getinfo`,
  ).then(({ data }) => data)
}