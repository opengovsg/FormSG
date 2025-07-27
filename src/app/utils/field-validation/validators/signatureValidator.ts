import { left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSignatureResponse } from 'src/app/modules/submission/submission.types'
import { ISignatureFieldSchema, OmitUnusedValidatorProps } from 'src/types'

import { BasicField, SignatureResponseV3 } from '../../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'

type SignatureValidator = ResponseValidator<ProcessedSignatureResponse>
type SignatureValidatorConstructor = (
  signatureField: OmitUnusedValidatorProps<ISignatureFieldSchema>,
) => SignatureValidator

const signatureAnswerValidator: SignatureValidator = (response) => {
  // TODO: add proper validators
  return right(response)
}

export const constructSignatureValidator: SignatureValidatorConstructor = () =>
  flow(signatureAnswerValidator)

// v3

const isSignatureResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  SignatureResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Signature) {
    return left(
      `SignatureValidatorV3.fieldTypeMismatch:\tfieldType is not signature`,
    )
  }
  return right(response)
}

export const constructSignatureValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<ISignatureFieldSchema>,
  ParsedClearFormFieldResponseV3,
  SignatureResponseV3
> = () => flow(isSignatureResponseV3)
