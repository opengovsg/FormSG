import {
  StringAnswerResponseV3,
  VerifiableFieldResponseV3,
} from 'formsg-shared/types'
import { left, right } from 'fp-ts/lib/Either'

import {
  IEmailFieldSchema,
  IMobileFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import formsgSdk from '../../../config/formsg-sdk'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

/**
 * A function which returns a validator to check if single answer has a non-empty response
 */
export const notEmptySingleAnswerResponse: ResponseValidator<
  ProcessedSingleAnswerResponse
> = (response) => {
  if (response.answer.trim().length === 0)
    return left(
      'CommonValidator.notEmptySingleAnswerResponse:\tanswer is an empty string',
    )
  return right(response)
}

export const notEmptySingleAnswerResponseV3 = <
  T extends { answer: StringAnswerResponseV3 },
>(
  response: T,
) => {
  if (!response.answer || response.answer.trim().length === 0) {
    return left(
      'CommonValidatorV3.notEmptySingleAnswerResponseV3:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

export const notEmptyVerifiableAnswerResponseV3 = <
  T extends { answer: VerifiableFieldResponseV3 },
>(
  response: T,
) => {
  if (response.answer.value.trim().length === 0) {
    return left(
      'CommonValidatorV3.notEmptyVerifiableAnswerResponseV3:\tanswer is an empty string',
    )
  }
  return right(response)
}

/**
 * A function which returns a signature validator constructor for mobile and email verified field.
 * The validator checks if field has correct signature.
 */
export const makeSignatureValidator: (
  formField:
    | OmitUnusedValidatorProps<IEmailFieldSchema>
    | OmitUnusedValidatorProps<IMobileFieldSchema>,
) => ResponseValidator<ProcessedSingleAnswerResponse> =
  (formField) => (response) => {
    const { isVerifiable, _id } = formField
    if (!isVerifiable) {
      return right(response) // no validation occurred
    }
    const { signature, answer } = response
    if (!signature) {
      return left(
        `CommonValidator.makeSignatureValidator:\t answer signature is missing`,
      )
    }
    const isSigned =
      formsgSdk.verification.authenticate &&
      formsgSdk.verification.authenticate({
        signatureString: signature,
        submissionCreatedAt: Date.now(),
        fieldId: _id,
        answer,
      })

    return isSigned
      ? right(response)
      : left(
          `CommonValidator.makeSignatureValidator:\t answer does not have valid signature`,
        )
  }

/**
 * A function which returns a signature validator constructor for mobile and email verified field.
 * The validator checks if field has correct signature.
 */
export const makeSignatureValidatorV3 =
  <T extends { answer: VerifiableFieldResponseV3 }>(
    formField:
      | OmitUnusedValidatorProps<IEmailFieldSchema>
      | OmitUnusedValidatorProps<IMobileFieldSchema>,
  ) =>
  (response: T) => {
    const { isVerifiable, _id } = formField
    if (!isVerifiable) {
      return right(response) // no validation occurred
    }
    const { value, signature } = response.answer
    if (!signature) {
      // TODO: (FM-1688) Remove this log after sure that validation logic works as expected.
      return left(
        `CommonValidatorV3.makeSignatureValidator:\t answer signature is missing. value: ${value}, signature: ${signature}`,
      )
    }
    const isSigned =
      formsgSdk.verification.authenticate &&
      formsgSdk.verification.authenticate({
        signatureString: signature,
        submissionCreatedAt: Date.now(),
        fieldId: _id,
        answer: value,
      })

    return isSigned
      ? right(response)
      : // TODO: (FM-1688) Remove this log after sure that validation logic works as expected.
        left(
          `CommonValidatorV3.makeSignatureValidator:\t answer does not have valid signature. value: ${value}, signature: ${signature}`,
        )
  }

/**
 * A function which returns a signature validator constructor for mobile and email verified field (V4).
 * V4 verifiable answer shape matches V3 ({ value, signature? }), but V4 chains should not depend on V3 helpers.
 */
export const makeSignatureValidatorV4 =
  <T extends { answer: { value: string; signature?: string } }>(
    formField:
      | OmitUnusedValidatorProps<IEmailFieldSchema>
      | OmitUnusedValidatorProps<IMobileFieldSchema>,
  ) =>
  (response: T) => {
    const { isVerifiable, _id } = formField
    if (!isVerifiable) {
      return right(response) // no validation occurred
    }
    const { value, signature } = response.answer
    if (!signature) {
      return left(
        `CommonValidatorV4.makeSignatureValidator:\t answer signature is missing. value: ${value}`,
      )
    }
    const isSigned =
      formsgSdk.verification.authenticate &&
      formsgSdk.verification.authenticate({
        signatureString: signature,
        submissionCreatedAt: Date.now(),
        fieldId: _id,
        answer: value,
      })

    return isSigned
      ? right(response)
      : left(
          `CommonValidatorV4.makeSignatureValidator:\t answer does not have valid signature. value: ${value}`,
        )
  }
