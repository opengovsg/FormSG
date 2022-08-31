import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { CountryRegion } from '../../../../../shared/constants/countryRegion'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'
import { isOneOfOptions } from './options'

type CountryValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type CountryValidatorConstructor = () => CountryValidator

/**
 * Returns a validation function
 * to check if country selection is one of the options.
 */
const makeCountryValidator: CountryValidatorConstructor = () => (response) => {
  const validOptions = Object.values(CountryRegion)
  const { answer } = response
  return isOneOfOptions(validOptions, answer)
    ? right(response)
    : left(`CountryValidator:\t answer is not a valid country option`)
}

/**
 * Returns a validation function for a country field when called.
 */
export const constructCountryValidator: CountryValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(makeCountryValidator()))
