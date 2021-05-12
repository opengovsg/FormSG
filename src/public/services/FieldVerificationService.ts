import axios from 'axios'
import { Opaque } from 'type-fest'

import { PublicTransaction } from 'src/types'

export type JsonDate = Opaque<string, 'JsonDate'>

/**
 * Response when retrieving new transaction. Can be an empty object if the
 * current form does not have any verifiable fields.
 */
export type FetchNewTransactionResponse =
  | { expireAt: JsonDate; transactionId: string }
  | Record<string, never>

type VerifiedFieldSignature = Opaque<string, 'VerifiedFieldSignature'>

/** Exported for testing */
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
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field
 * @param answer The value of the verification field to verify. Usually an email or phone number
 * @returns 201 Created status if successfully sent
 */
export const triggerSendOtp = async ({
  transactionId,
  fieldId,
  answer,
}: {
  transactionId: string
  fieldId: string
  answer: string
}): Promise<void> => {
  return axios.post(`${TRANSACTION_ENDPOINT}/${transactionId}/otp`, {
    fieldId,
    answer,
  })
}

/**
 * Verifies given OTP for given fieldId
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field
 * @param otp The user-entered OTP value to verify against
 * @returns The verified signature on success
 */
export const verifyOtp = async ({
  transactionId,
  fieldId,
  otp,
}: {
  transactionId: string
  fieldId: string
  otp: string
}): Promise<VerifiedFieldSignature> => {
  return axios
    .post<VerifiedFieldSignature>(
      `${TRANSACTION_ENDPOINT}/${transactionId}/otp/verify`,
      {
        fieldId,
        otp,
      },
    )
    .then(({ data }) => data)
}

/**
 * Reset the field in the transaction, removing the previously saved signature.
 *
 * @param transactionId The generated transaction id for the form
 * @param fieldId The id of the verification field to reset
 * @returns 200 OK status if successfully reset
 */
export const resetVerifiedField = async ({
  transactionId,
  fieldId,
}: {
  transactionId: string
  fieldId: string
}): Promise<void> => {
  return axios.post(`${TRANSACTION_ENDPOINT}/${transactionId}/reset`, {
    fieldId,
  })
}

/**
 * Retrieves the transaction of the form with the given Id.
 *
 * @param transactionId The generated transaction id for the form
 * @param formId The id of form
 * @returns 200 with transactionId/formId and expiry time when transaction exists
 * @returns 404 when the transaction could not be found
 * @returns 500 when internal server occurs
 */
export const retrieveTransactionById = ({
  formId,
  transactionId,
}: {
  formId: string
  transactionId: string
}): Promise<PublicTransaction> => {
  return axios
    .get<PublicTransaction>(
      `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}`,
    )
    .then(({ data }) => data)
}
