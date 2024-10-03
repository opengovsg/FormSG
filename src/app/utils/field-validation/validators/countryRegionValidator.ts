import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { BasicField, CountryRegionResponseV3 } from 'shared/types'

import { ParsedClearFormFieldResponseV3 } from 'src/types/api'

import { CountryRegion } from '../../../../../shared/constants/countryRegion'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'
import { isOneOfOptions } from './options'

type CountryRegionValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type CountryRegionValidatorConstructor = () => CountryRegionValidator

/**
 * Returns a validation function
 * to check if country/region selection is one of the options.
 * We need to validate the response against options in upper-case because PublicFormProvider.handleSubmitForm transforms the response into upper-case.
 * We want users to see the country/region options in title-case but we also need the data in the backend to remain in upper-case.
 */
const makeCountryRegionValidator: CountryRegionValidatorConstructor =
  () => (response) => {
    const validOptions = Object.values(CountryRegion)
    const validOptionsInUpperCase = validOptions.map((option) =>
      option.toUpperCase(),
    )
    const { answer } = response
    return isOneOfOptions(validOptionsInUpperCase, answer)
      ? right(response)
      : left(
          `CountryRegionValidator:\t answer is not a valid country/region option`,
        )
  }

/**
 * Returns a validation function for a country/region field when called.
 */
export const constructCountryRegionValidator: CountryRegionValidatorConstructor =
  () => flow(notEmptySingleAnswerResponse, chain(makeCountryRegionValidator()))

const isCountryRegionResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  CountryRegionResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.CountryRegion) {
    return left(
      `CountryRegionValidatorV3.fieldTypeMismatch:\t fieldType is not country_region`,
    )
  }
  return right(response)
}

/**
 * Returns a validation function
 * to check if country/region selection is one of the options.
 * We need to validate the response against options in upper-case because PublicFormProvider.handleSubmitForm transforms the response into upper-case.
 * We want users to see the country/region options in title-case but we also need the data in the backend to remain in upper-case.
 */
const isCountryRegionValidV3: ResponseValidator<CountryRegionResponseV3> = (
  response,
) => {
  const validOptions = Object.values(CountryRegion)
  const validOptionsInUpperCase = validOptions.map((option) =>
    option.toUpperCase(),
  )
  const { answer } = response
  return isOneOfOptions(validOptionsInUpperCase, answer)
    ? right(response)
    : left(
        `CountryRegionValidator:\t answer is not a valid country/region option`,
      )
}

export const constructCountryRegionValidatorV3: () => ResponseValidator<
  ParsedClearFormFieldResponseV3,
  CountryRegionResponseV3
> = () =>
  flow(
    isCountryRegionResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(isCountryRegionValidV3),
  )
