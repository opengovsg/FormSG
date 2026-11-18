import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  CorppassAttribute,
  NricFieldBase,
} from 'formsg-shared/types'
import {
  isMFinSeriesValid,
  isNricValid,
} from 'formsg-shared/utils/nric-validation'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type NricValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type NricFieldSource = Pick<NricFieldBase, 'corppass'>
type NricValidatorConstructor = (nricField: NricFieldSource) => NricValidator

/**
 * Corppass supplies the representative's identifier, which can be foreign, so
 * the Corppass NRIC/FIN field only checks that it matches the login.
 */
const isCorppassUidField = (nricField: NricFieldSource): boolean =>
  nricField.corppass?.attr === CorppassAttribute.Uid

/**
 * Returns a validator to check if nric
 * format is correct.
 */
const nricValidator: NricValidator = (response) => {
  return isNricValid(response.answer) || isMFinSeriesValid(response.answer)
    ? right(response)
    : left(`NricValidator:\tanswer is not a valid NRIC`)
}

/**
 * Returns a validation function for a nric field when called.
 */
export const constructNricValidator: NricValidatorConstructor = (nricField) =>
  isCorppassUidField(nricField)
    ? notEmptySingleAnswerResponse
    : flow(notEmptySingleAnswerResponse, chain(nricValidator))

// V4

type NricResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Nric
  answer: StringAnswerV4
}

const isNricResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  NricResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Nric) {
    return left(`NricValidatorV4.fieldTypeMismatch:\tfieldType is not nric`)
  }
  return right(response as NricResponseV4)
}

const notEmptyNricAnswerV4: ResponseValidator<NricResponseV4> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'NricValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const nricValidatorV4: ResponseValidator<NricResponseV4> = (response) => {
  return isNricValid(response.answer.value) ||
    isMFinSeriesValid(response.answer.value)
    ? right(response)
    : left(`NricValidatorV4:\tanswer is not a valid NRIC`)
}

export const constructNricValidatorV4: (
  nricField: NricFieldSource,
) => ResponseValidator<ParsedClearFormFieldResponseV4, NricResponseV4> = (
  nricField,
) =>
  isCorppassUidField(nricField)
    ? flow(isNricResponseV4, chain(notEmptyNricAnswerV4))
    : flow(
        isNricResponseV4,
        chain(notEmptyNricAnswerV4),
        chain(nricValidatorV4),
      )
