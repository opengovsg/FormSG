import { SignatureAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField, SignatureResponseV3 } from 'formsg-shared/types'
import { left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSignatureResponse } from 'src/app/modules/submission/submission.types'
import { ISignatureFieldSchema, OmitUnusedValidatorProps } from 'src/types'

import {
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'

type SignatureValidator = ResponseValidator<ProcessedSignatureResponse>
type SignatureValidatorConstructor = (
  signatureField: OmitUnusedValidatorProps<ISignatureFieldSchema>,
) => SignatureValidator

const signatureAnswerValidator: SignatureValidator = (response) => {
  // TODO: add proper validators signature field v1.1
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

// V4
// V4 signature: answer = { value: [number, number, number][][], type: 'draw' }

type SignatureResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Signature
  answer: SignatureAnswerV4
}

const isSignatureResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  SignatureResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Signature) {
    return left(
      `SignatureValidatorV4.fieldTypeMismatch:\tfieldType is not signature`,
    )
  }
  return right(response as SignatureResponseV4)
}

export const constructSignatureValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<ISignatureFieldSchema>,
  ParsedClearFormFieldResponseV4,
  SignatureResponseV4
> = () => flow(isSignatureResponseV4)
