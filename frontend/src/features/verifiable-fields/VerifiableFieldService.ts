import { Opaque } from 'type-fest'

import { SendFormOtpResponseDto } from '~shared/types/form'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'

/**
 * Response when retrieving new transaction. Can be an empty object if the
 * current form does not have any verifiable fields.
 */
export type FetchNewTransactionResponse =
  | { expireAt: Date; transactionId: string }
  | Record<string, never>

type VerifiedFieldSignature = Opaque<string, 'VerifiedFieldSignature'>

const FORM_API_PREFIX = '/forms'
const VERIFICATION_ENDPOINT = 'fieldverifications'

/**
 * Create a transaction for given form.
 * @param formId The id of the form to create a transaction for
 * @returns transaction metadata on success. Can be empty if no transactions are found in the form.
 */
export const createTransactionForForm = async (
  formId: string,
): Promise<FetchNewTransactionResponse> => {
  return ApiService.post<FetchNewTransactionResponse>(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}`,
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}

/**
 * Sends an OTP to given answer.
 * @param args
 * @param args.formId The id of the form to generate the otp for
 * @param args.transactionId The generated transaction id for the form
 * @param args.fieldId The id of the verification field
 * @param args.answer The value of the verification field to verify. Usually an email or phone number
 * @returns 201 Created status if successfully sent
 */
export const triggerSendOtp = async ({
  formId,
  transactionId,
  fieldId,
  answer,
}: {
  /** The id of the form to generate the otp for */
  formId: string
  /** The generated transaction id for the form */
  transactionId: string
  /** The id of the verification field */
  fieldId: string
  /** The value of the verification field to verify. Usually an email or phone number */
  answer: string
}): Promise<SendFormOtpResponseDto> => {
  return ApiService.post(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/otp/generate`,
    {
      answer,
    },
  ).then(({ data }) => data)
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
  return ApiService.post<VerifiedFieldSignature>(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/otp/verify`,
    {
      otp,
    },
  ).then(({ data }) => data)
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
  return ApiService.post(
    `${FORM_API_PREFIX}/${formId}/${VERIFICATION_ENDPOINT}/${transactionId}/fields/${fieldId}/reset`,
  )
}
