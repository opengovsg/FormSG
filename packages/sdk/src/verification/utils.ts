import { VerificationBasestringOptions } from '../types'

/**
 * Checks if signature was made within the given expiry range before
 * submission was created.
 * @param signatureTime ms
 * @param submissionCreatedAt ms
 */
export const isSignatureTimeValid = (
  signatureTime: number,
  submissionCreatedAt: number,
  transactionExpiry: number
): boolean => {
  const maxTime = submissionCreatedAt
  const minTime = maxTime - transactionExpiry * 1000
  return signatureTime > minTime && signatureTime < maxTime
}

/**
 * Formats given data into a string for signing
 */
export const formatToBaseString = ({
  transactionId,
  formId,
  fieldId,
  answer,
  time,
}: VerificationBasestringOptions): string => {
  return `${transactionId}.${formId}.${fieldId}.${answer}.${time}`
}
