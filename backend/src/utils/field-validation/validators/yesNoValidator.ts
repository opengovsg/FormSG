import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from '@root/modules/submission/submission.types'
import { ResponseValidator } from '@root/types/field/utils/validation'

import { notEmptySingleAnswerResponse } from './common'

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
