import axios from 'axios'
import type { Opaque } from 'type-fest'

export type JsonDate = Opaque<string, 'JsonDate'>

/**
 * Response when retrieving new transaction. Can be an empty object if the
 * current form does not have any verifiable fields.
 */
export type FetchNewTransactionResponse =
  | { expireAt: JsonDate; transactionId: string }
  | Record<string, never>

type VerifiedFieldSignature = Opaque<string, 'VerifiedFieldSignature'>

/** Exported for testing
 * @deprecated
 */
export const TRANSACTION_ENDPOINT = '/transaction'

/** Exported for testing */
export const FORM_API_PREFIX = '/api/v3/forms'
export const VERIFICATION_ENDPOINT = 'fieldverifications'

/**
 * Create a transaction for given form.
 * @param formId The id of the form to create a transaction for
 * @returns transaction metadata on success. Can be empty if no transactions are found in the form.
 */
export const createTransactionForForm = async (
  formId: string,
): Promise<FetchNewTransactionResponse> => {
  return axios
    .post<FetchNewTransactionResponse>(
      `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}`,
    )
    .then(({ data }) => data)
}

/**
 * Sends an OTP to given answer.
 * @param formId The id of the form to generate the otp for
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field
 * @param answer The value of the verification field to verify. Usually an email or phone number
 * @param fieldType The kind of field to generate the otp for
 * @returns 201 Created status if successfully sent
 */
export const triggerSendOtp = async ({
  formId,
  transactionId,
  fieldId,
  answer,
}: {
  formId: string
  transactionId: string
  fieldId: string
  answer: string
}): Promise<void> => {
  return axios.post(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/otp/generate`,
    {
      answer,
    },
  )
}

/**
 * Verifies given OTP for given fieldId
 * @param formId The id of the form
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field
 * @param otp The user-entered OTP value to verify against
 * @returns The verified signature on success
 */
export const verifyOtp = async ({
  formId,
  transactionId,
  fieldId,
  otp,
}: {
  formId: string
  transactionId: string
  fieldId: string
  otp: string
}): Promise<VerifiedFieldSignature> => {
  return axios
    .post<VerifiedFieldSignature>(
      `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/otp/verify`,
      {
        otp,
      },
    )
    .then(({ data }) => data)
}

/**
 * Reset the field in the transaction, removing the previously saved signature.
 *
 * @param formId The id of the form to reset the transaction for
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field to reset
 * @returns 204 Created if successfully reset
 */
export const resetVerifiedField = async ({
  formId,
  transactionId,
  fieldId,
}: {
  formId: string
  transactionId: string
  fieldId: string
}): Promise<void> => {
  return axios.post(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/reset`,
  )
}
