import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSignatureResponse } from 'src/app/modules/submission/submission.types'
import { ISignatureFieldSchema, OmitUnusedValidatorProps } from 'src/types'

import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'

type SignatureValidator = ResponseValidator<ProcessedSignatureResponse>
type SignatureValidatorConstructor = (
  signatureField: OmitUnusedValidatorProps<ISignatureFieldSchema>,
) => SignatureValidator

const signatureAnswerValidator: SignatureValidator = (response) => {
  const { answer } = response

  // TODO: add proper validators
  return right(response)
}

export const constructSignatureValidator: SignatureValidatorConstructor = () =>
  flow(signatureAnswerValidator)
