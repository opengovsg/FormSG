import { API_BASE_URL } from '~services/ApiService'

export const getPaymentPageUrl = (formId: string, paymentId: string) => {
  return `/${formId}/payment/${paymentId}` as const
}

export const getPaymentReceiptDownloadUrl = (
  formId: string,
  paymentId: string,
) => {
  return `${API_BASE_URL}/payments/${formId}/${paymentId}/receipt/download` as const
}
