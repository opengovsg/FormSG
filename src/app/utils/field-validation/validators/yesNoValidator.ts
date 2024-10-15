import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { BasicField, YesNoResponseV3 } from '../../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type YesNoValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type YesNoValidatorConstructor = () => YesNoValidator

/**
 * Returns a validator to check if yesNo response is either yes or no
 */
const yesNoValidator: YesNoValidator = (response) => {
  const { answer } = response

  return ['Yes', 'No'].includes(answer)
    ? right(response)
    : left(`YesNoValidator:\tanswer is not a valid YesNo response`)
}

/**
 * Returns a validation function for a yesNo field when called.
 */
export const constructYesNoValidator: YesNoValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(yesNoValidator))

export const isYesNoResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  YesNoResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.YesNo) {
    return left(`YesNoValidatorV3.fieldTypeMismatch:\tfieldType is not yes_no`)
  }
  return right(response)
}

/**
 * Returns a validator to check if yesNo response is either yes or no
 */
const yesNoValidatorV3: ResponseValidator<YesNoResponseV3> = (response) => {
  const { answer } = response

  return ['Yes', 'No'].includes(answer)
    ? right(response)
    : left(`YesNoValidator:\tanswer is not a valid YesNo response`)
}

export const constructYesNoValidatorV3: () => ResponseValidator<
  ParsedClearFormFieldResponseV3,
  YesNoResponseV3
> = () =>
  flow(
    isYesNoResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(yesNoValidatorV3),
  )
