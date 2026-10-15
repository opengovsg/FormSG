import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  CorppassAttribute,
  UenFieldBase,
} from 'formsg-shared/types'
import { isUenValid } from 'formsg-shared/utils/uen-validation'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type UenValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type UenFieldSource = Pick<UenFieldBase, 'corppass'>
type UenValidatorConstructor = (uenField: UenFieldSource) => UenValidator

/**
 * Corppass supplies the entity's ID, which is not a UEN for foreign, ASGD/ITR
 * or GST-registered entities, so the Corppass UEN field only checks that it
 * matches the login.
 */
const isCorppassUenField = (uenField: UenFieldSource): boolean =>
  uenField.corppass?.attr === CorppassAttribute.Uen

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
export const constructUenValidator: UenValidatorConstructor = (uenField) =>
  isCorppassUenField(uenField)
    ? notEmptySingleAnswerResponse
    : flow(notEmptySingleAnswerResponse, chain(uenValidator))

// V4

type UenResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Uen
  answer: StringAnswerV4
}

const isUenResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  UenResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Uen) {
    return left(`UenValidatorV4.fieldTypeMismatch:\tfieldType is not uen`)
  }
  return right(response as UenResponseV4)
}

const notEmptyUenAnswerV4: ResponseValidator<UenResponseV4> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'UenValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const uenValidatorV4: ResponseValidator<UenResponseV4> = (response) => {
  return isUenValid(response.answer.value)
    ? right(response)
    : left(`UenValidatorV4:\tanswer is not a valid UEN`)
}

export const constructUenValidatorV4: (
  uenField: UenFieldSource,
) => ResponseValidator<ParsedClearFormFieldResponseV4, UenResponseV4> = (
  uenField,
) =>
  isCorppassUenField(uenField)
    ? flow(isUenResponseV4, chain(notEmptyUenAnswerV4))
    : flow(isUenResponseV4, chain(notEmptyUenAnswerV4), chain(uenValidatorV4))
