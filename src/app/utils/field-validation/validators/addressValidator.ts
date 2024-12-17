import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedAddressResponse } from 'src/app/modules/submission/submission.types'
import {
  IAddressCompoundFieldSchema,
  OmitUnusedValidatorProps,
} from 'src/types'

import {
  AddressCompoundFieldBase,
  AddressResponse,
  AddressResponseV3,
  BasicField,
} from '../../../../../shared/types'
import { validatePostalCode } from '../../../../../shared/utils/address-validation'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'

type AddressValidator = ResponseValidator<ProcessedAddressResponse>
type AddressValidatorConstructor = (
  addressField: OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
) => AddressValidator

/**
 * Returns a validator to check if postal code format is correct
 */
const addressValidator: AddressValidator = (response) => {
  const { answerArray } = response
  return validatePostalCode(answerArray.postalCode)
    ? right(response)
    : left(`AddressValidator:\t answer is not a valid postal code`)
}

export const constructAddressValidator: AddressValidatorConstructor = () =>
  flow(addressValidator) // TODO fix this

// v3
// interface AddressValidatorData {
//   addressField: AddressCompoundFieldBase
//   formId: string
//   isVisible: boolean
//   isDisabled: boolean
// }

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

// const addressValidatorV3: ResponseValidator<
//   AddressValidatorData,
//   AddressResponseV3
// > =
//   ({ addressField }) =>
//   (response) => {
//     const answerArray = response.answerArray
//     return validatePostalCode(response.answer.postalCode)
//       ? right(response)
//       : left(`AddressValidatorV3:\t answer is not a valid postal code`)
//   }

export const constructAddressValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
  ParsedClearFormFieldResponseV3,
  AddressResponseV3
> = () =>
  flow(
    isAddressResponseV3,
    // chain(notEmptySingleAnswerResponseV3),
    // chain(addressValidatorV3), // TODO fix this
  )
