export const getPaymentInvoiceDownloadUrl = (
  formId: string,
  paymentId: string,
) => {
  return `${process.env.appUrl}/api/v3/payments/${formId}/${paymentId}/invoice/download` as const
}
