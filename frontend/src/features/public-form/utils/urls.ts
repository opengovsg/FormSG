import { getPaymentInvoiceDownloadUrlPath } from '~shared/utils/urls'

import { API_BASE_URL } from '~services/ApiService'

export const getPaymentPageUrl = (formId: string, paymentId: string) => {
  return `/${formId}/payment/${paymentId}` as const
}

export const getPaymentInvoiceDownloadUrl = (
  formId: string,
  paymentId: string,
) => {
  return `${API_BASE_URL}/${getPaymentInvoiceDownloadUrlPath(
    formId,
    paymentId,
  )}` as const
}

export const getPublicFormUrl = (formId: string) => {
  return `/${formId}` as const
}
