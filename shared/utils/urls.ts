export const getPaymentInvoiceDownloadUrlPath = (
  formId: string,
  paymentId: string,
) => {
  return `payments/${formId}/${paymentId}/invoice/download` as const
}

export const getMultirespondentSubmissionEditPath = (
  formId: string,
  submissionId: string,
) => {
  return `${formId}/edit/${submissionId}`
}
