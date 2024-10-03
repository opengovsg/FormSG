import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { BasicField, UenResponseV3 } from 'shared/types'

import { isUenValid } from '../../../../../shared/utils/uen-validation'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type UenValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type UenValidatorConstructor = () => UenValidator

/**
 * Returns a validator to check if uen
 * format is correct.
 */
const uenValidator: UenValidator = (response) => {
  return isUenValid(response.answer)
    ? right(response)
    : left(`UenValidator:\tanswer is not a valid UEN`)
}

/**
 * Returns a validation function for a uen field when called.
 */
export const constructUenValidator: UenValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(uenValidator))

const isUenResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  UenResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Uen) {
    return left(`NricValidatorV3.fieldTypeMismatch:\tfieldType is not nric`)
  }
  return right(response)
}

/**
 * Returns a validator to check if uen
 * format is correct.
 */
const uenValidatorV3: ResponseValidator<UenResponseV3> = (response) => {
  return isUenValid(response.answer)
    ? right(response)
    : left(`UenValidatorV3:\tanswer is not a valid UEN`)
}

export const constructUenValidatorV3: () => ResponseValidator<
  ParsedClearFormFieldResponseV3,
  UenResponseV3
> = () =>
  flow(
    isUenResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(uenValidatorV3),
  )
