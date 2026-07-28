export const getPaymentInvoiceDownloadUrlPath = (
  formId: string,
  paymentId: string,
) => {
  return `payments/${formId}/${paymentId}/invoice/download` as const
}

/**
 * Returns the respondent path for MRF submission edit page
 *
 * Supply options.key to obtain the path with a prefilled key
 *
 * Usage:
 * ```
 * const editPath = getMultirespondentSubmissionEditPath(
 *   form._id,
 *   submissionId, {
 *     key: submissionSecretKey,
 * })
 *
 * const resolvedPath = `${window.location.origin}/${editPath}`
 * ```
 * @param formId
 * @param submissionId
 * @param options
 * @returns
 */
export const getMultirespondentSubmissionEditPath = (
  formId: string,
  submissionId: string,
  options?: {
    key?: string
    stepToken?: string
  },
) => {
  const editPath = `${formId}/edit/${submissionId}`
  const { key, stepToken } = options || {}
  if (key) {
    const withKey = `${editPath}?key=${encodeURIComponent(key)}`
    return stepToken
      ? `${withKey}&token=${encodeURIComponent(stepToken)}`
      : withKey
  }
  return editPath
}

export const getStatusTrackerPath = (
  formId: string,
  submissionId: string | undefined,
) => {
  return `${formId}/status/${submissionId}`
}
