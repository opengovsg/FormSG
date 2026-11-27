import {
  ConfirmPaymentDto,
  GetPaymentInfoDto,
  PaymentReceiptStatusDto,
} from 'formsg-shared/types'

import { ApiService } from '~services/ApiService'

const PAYMENTS_ENDPOINT = '/payments'

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
    `${PAYMENTS_ENDPOINT}/${formId}/${paymentId}/receipt/status`,
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
    `${PAYMENTS_ENDPOINT}/${paymentId}/getinfo`,
  ).then(({ data }) => data)
}

/**
 * Confirms the payment on the server with a payment method collected
 * on the client.
 * @param paymentId the id of the payment to confirm
 * @param paymentMethodId the id of the collected payment method
 * @returns the resulting payment intent status on success
 */
export const confirmPayment = async (
  paymentId: string,
  paymentMethodId: string,
): Promise<ConfirmPaymentDto> => {
  return ApiService.post<ConfirmPaymentDto>(
    `${PAYMENTS_ENDPOINT}/${paymentId}/confirm`,
    { paymentMethodId },
  ).then(({ data }) => data)
}

/**
 * Obtain the payment id if the respondent has already
 * made a payment on a specific form before.
 * @param email the email of the user making the payment
 * @param formId the id of the form
 * @returns payment id if the respondent has made a payment
 * @returns undefined if the respondent has yet to make payment
 */
export const getPreviousPaymentId = async (
  email: string,
  formId: string,
): Promise<string> => {
  const emailData = { email }
  return ApiService.post<string>(
    `${PAYMENTS_ENDPOINT}/${formId}/payments/previous/`,
    emailData,
  ).then(({ data }) => data)
}
