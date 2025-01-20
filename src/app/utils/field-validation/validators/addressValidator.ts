import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedAddressResponse } from 'src/app/modules/submission/submission.types'
import {
  IAddressCompoundFieldSchema,
  OmitUnusedValidatorProps,
} from 'src/types'

import { AddressResponseV3, BasicField } from '../../../../../shared/types'
import {
  validateLevelUnit,
  validateNoNonNumerical,
  validateNoSpecialCharacters,
  validatePostalCode,
} from '../../../../../shared/utils/address-validation'
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
 * Returns a validator to address field is legitimate (must have 6 subfields)
 */
const addressAnswerValidator: AddressValidator = (response) => {
  const { answerArray } = response

  return answerArray.length === 6
    ? right(response)
    : left(`AddressValidator:\t answer is not a address field value`)
}

/**
 * Returns validation function to check for valid postal code
 */
const validPostalCode: AddressValidator = (response) => {
  const { answerArray } = response
  const entry = answerArray.find((subField) =>
    subField.startsWith('postalCode'),
  )
  const postalCode = entry ? entry.split('_')[1] : ''
  return validatePostalCode(postalCode)
    ? right(response)
    : left(`AddressValidator:\t postal code is not valid`)
}

const validBlockNumber: AddressValidator = (response) => {
  const { answerArray } = response
  const entry = answerArray.find((subField) =>
    subField.startsWith('blockNumber'),
  )
  const blockNumber = entry ? entry.split('_')[1] : ''
  return validateNoSpecialCharacters(blockNumber)
    ? right(response)
    : left(`AddressValidator:\t block number is not valid`)
}

const validUnitNumber: AddressValidator = (response) => {
  const { answerArray } = response
  const entry = answerArray.find((subField) =>
    subField.startsWith('unitNumber'),
  )
  const level = answerArray.find((subField) =>
    subField.startsWith('levelNumber'),
  )
  const unitNumber = entry ? entry.split('_')[1] : ''
  const levelNumber = level ? level.split('_')[1] : ''
  const validUnitNumber = unitNumber
    ? validateNoSpecialCharacters(unitNumber)
    : true
  return validUnitNumber && validateLevelUnit(unitNumber, levelNumber)
    ? right(response)
    : left(`AddressValidator:\t unit number is not valid`)
}

const validLevelNumber: AddressValidator = (response) => {
  const { answerArray } = response
  const entry = answerArray.find((subField) =>
    subField.startsWith('levelNumber'),
  )
  const unit = answerArray.find((subField) => subField.startsWith('unitNumber'))
  const levelNumber = entry ? entry.split('_')[1] : ''
  const unitNumber = unit ? unit.split('_')[1] : ''

  const validLevelNumber = levelNumber
    ? validateNoNonNumerical(levelNumber)
    : true
  return validLevelNumber && validateLevelUnit(levelNumber, unitNumber)
    ? right(response)
    : left(`AddressValidator:\t level number is not valid`)
}

export const constructAddressValidator: AddressValidatorConstructor = () =>
  flow(
    addressAnswerValidator,
    chain(validPostalCode),
    chain(validBlockNumber),
    chain(validUnitNumber),
    chain(validLevelNumber),
  )

export const constructOptionalAddressValidator: AddressValidatorConstructor =
  () => flow(validLevelNumber, chain(validUnitNumber))

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

const addressPostalCodeValidatorV3: ResponseValidator<AddressResponseV3> = (
  response,
) => {
  const { addressSubFields } = response.answer
  return validatePostalCode(addressSubFields.postalCode)
    ? right(response)
    : left(`AddressValidator:\t postal code is not valid`)
}

const addressBlockNumberValidatorV3: ResponseValidator<AddressResponseV3> = (
  response,
) => {
  const { addressSubFields } = response.answer
  return validateNoSpecialCharacters(addressSubFields.blockNumber)
    ? right(response)
    : left(`AddressValidator:\t block number is not valid`)
}

const addressUnitNumberValidatorV3: ResponseValidator<AddressResponseV3> = (
  response,
) => {
  const { addressSubFields } = response.answer
  const validUnitNumber = addressSubFields.unitNumber
    ? validateNoSpecialCharacters(addressSubFields.unitNumber)
    : true
  return validUnitNumber &&
    validateLevelUnit(addressSubFields.unitNumber, addressSubFields.levelNumber)
    ? right(response)
    : left(`AddressValidator:\t unit number is not valid`)
}

const addressLevelNumberValidatorV3: ResponseValidator<AddressResponseV3> = (
  response,
) => {
  const { addressSubFields } = response.answer
  const validLevelNumber = addressSubFields.levelNumber
    ? validateNoNonNumerical(addressSubFields.levelNumber)
    : true
  return validLevelNumber &&
    validateLevelUnit(addressSubFields.levelNumber, addressSubFields.unitNumber)
    ? right(response)
    : left(`AddressValidator:\t level number is not valid`)
}

export const constructAddressValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
  ParsedClearFormFieldResponseV3,
  AddressResponseV3
> = () =>
  flow(
    isAddressResponseV3,
    chain(addressPostalCodeValidatorV3),
    chain(addressBlockNumberValidatorV3),
    chain(addressLevelNumberValidatorV3),
    chain(addressUnitNumberValidatorV3),
  )

export const constructOptionalAddressValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
  ParsedClearFormFieldResponseV3,
  AddressResponseV3
> = () =>
  flow(
    isAddressResponseV3,
    chain(addressLevelNumberValidatorV3),
    chain(addressUnitNumberValidatorV3),
  )
