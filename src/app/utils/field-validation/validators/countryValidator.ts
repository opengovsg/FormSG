import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import myInfoCountries from 'shared/constants/field/myinfo/myinfo-countries'

import {
  ICountryFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import { notEmptySingleAnswerResponse } from './common'

type CountryValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type CountryValidatorConstructor = (
  dropdownField: OmitUnusedValidatorProps<ICountryFieldSchema>,
) => CountryValidator

const countries = new Set(myInfoCountries)

/**
 * Returns a validation function
 * to check if dropdown selection is one of the values from myInfoCountries.
 */
const makeCountryValidator: CountryValidatorConstructor =
  (dropdownField) => (response) => {
    console.log(dropdownField) // TODO: Deal with this
    const { answer } = response
    return countries.has(answer)
      ? right(response)
      : left(`CountryValidator:\t answer is not a valid dropdown option`)
  }

/**
 * Returns a validation function for a country field when called.
 */
export const constructCountryValidator: CountryValidatorConstructor = (
  dropdownField,
) =>
  flow(notEmptySingleAnswerResponse, chain(makeCountryValidator(dropdownField)))
