import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { AddressResponseV3, BasicField } from 'shared/types'
import { validatePostalCode } from 'shared/utils/address-validation'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { IAddressFieldSchema, OmitUnusedValidatorProps } from 'src/types'

import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'

type AddressValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type AddressValidatorConstructor = (
  addressField: OmitUnusedValidatorProps<IAddressFieldSchema>,
) => AddressValidator

/**
 * Returns a validator to check if postal code format is correct
 */
const addressValidator: AddressValidator = (response) => {
  return validatePostalCode(response.answer)
    ? right(response)
    : left(`AddressValidator:\t answer is not a valid postal code`)
}

export const constructAddressValidator: AddressValidatorConstructor = () =>
  flow(notEmptySingleAnswerResponse, chain(addressValidator))

// v3

const isAddressResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  AddressResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Address) {
    return left(
      `AddressValidatorV3.fieldTypeMismatch:\tfieldType is not address`,
    )
  }
  return right(response)
}

const addressValidatorV3: ResponseValidator<AddressResponseV3> = (response) => {
  return validatePostalCode(response.answer.postalCode)
    ? right(response)
    : left(`AddressValidatorV3:\t answer is not a valid postal code`)
}

export const constructAddressValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressFieldSchema>,
  ParsedClearFormFieldResponseV3,
  AddressResponseV3
> = () =>
  flow(
    isAddressResponseV3,
    // chain(notEmptySingleAnswerResponseV3),
    chain(addressValidatorV3),
  )
