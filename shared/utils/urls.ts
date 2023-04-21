export const getPaymentInvoiceDownloadUrlPath = (
  formId: string,
  paymentId: string,
) => {
  return `payments/${formId}/${paymentId}/invoice/download` as const
}
