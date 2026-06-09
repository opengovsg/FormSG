import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { CountryRegion } from 'formsg-shared/constants/countryRegion'
import { BasicField, CountryRegionResponseV3 } from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../../types/api'
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
        `CountryRegionValidatorV3:\t answer is not a valid country/region option`,
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

// V4

type CountryRegionResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.CountryRegion
  answer: StringAnswerV4
}

const isCountryRegionResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  CountryRegionResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.CountryRegion) {
    return left(
      `CountryRegionValidatorV4.fieldTypeMismatch:\t fieldType is not country_region`,
    )
  }
  return right(response as CountryRegionResponseV4)
}

const notEmptyCountryRegionAnswerV4: ResponseValidator<
  CountryRegionResponseV4
> = (response) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'CountryRegionValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const isCountryRegionValidV4: ResponseValidator<CountryRegionResponseV4> = (
  response,
) => {
  const validOptions = Object.values(CountryRegion)
  const validOptionsInUpperCase = validOptions.map((option) =>
    option.toUpperCase(),
  )
  return isOneOfOptions(validOptionsInUpperCase, response.answer.value)
    ? right(response)
    : left(
        `CountryRegionValidatorV4:\t answer is not a valid country/region option`,
      )
}

export const constructCountryRegionValidatorV4: () => ResponseValidator<
  ParsedClearFormFieldResponseV4,
  CountryRegionResponseV4
> = () =>
  flow(
    isCountryRegionResponseV4,
    chain(notEmptyCountryRegionAnswerV4),
    chain(isCountryRegionValidV4),
  )
