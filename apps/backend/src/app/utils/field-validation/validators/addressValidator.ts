import { AddressAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import {
  validateLevelUnit,
  validateNoNonNumerical,
  validateNoSpecialCharacters,
  validatePostalCode,
} from 'formsg-shared/utils/address-validation'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedAddressResponse } from 'src/app/modules/submission/submission.types'
import {
  IAddressCompoundFieldSchema,
  OmitUnusedValidatorProps,
} from 'src/types'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
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
 * in the order of block number, street name, building name, level number, unit number, postal code
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

  return validatePostalCode(answerArray[5])
    ? right(response)
    : left(`AddressValidator:\t postal code is not valid`)
}

const validBlockNumber: AddressValidator = (response) => {
  const { answerArray } = response
  return validateNoSpecialCharacters(answerArray[0])
    ? right(response)
    : left(`AddressValidator:\t block number is not valid`)
}

const validUnitNumber: AddressValidator = (response) => {
  const { answerArray } = response
  const unitNumber = answerArray[4]
  const levelNumber = answerArray[3]
  const validUnitNumber = unitNumber
    ? validateNoSpecialCharacters(unitNumber)
    : true
  return validUnitNumber && validateLevelUnit(unitNumber, levelNumber)
    ? right(response)
    : left(`AddressValidator:\t unit number is not valid`)
}

const validLevelNumber: AddressValidator = (response) => {
  const { answerArray } = response
  const unitNumber = answerArray[4]
  const levelNumber = answerArray[3]

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

// V4
// V4 address: answer = { postalCode, blockNumber, streetName, buildingName, levelNumber, unitNumber }
// each field is { value: string }

type AddressResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Address
  answer: AddressAnswerV4
}

const isAddressResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  AddressResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Address) {
    return left(
      `AddressValidatorV4.fieldTypeMismatch:\tfieldType is not address`,
    )
  }
  return right(response as AddressResponseV4)
}

const addressPostalCodeValidatorV4: ResponseValidator<AddressResponseV4> = (
  response,
) => {
  return validatePostalCode(response.answer.postalCode.value)
    ? right(response)
    : left(`AddressValidatorV4:\t postal code is not valid`)
}

const addressBlockNumberValidatorV4: ResponseValidator<AddressResponseV4> = (
  response,
) => {
  return validateNoSpecialCharacters(response.answer.blockNumber.value)
    ? right(response)
    : left(`AddressValidatorV4:\t block number is not valid`)
}

const addressUnitNumberValidatorV4: ResponseValidator<AddressResponseV4> = (
  response,
) => {
  const unitNumber = response.answer.unitNumber.value
  const levelNumber = response.answer.levelNumber.value
  const validUnitNumber = unitNumber
    ? validateNoSpecialCharacters(unitNumber)
    : true
  return validUnitNumber && validateLevelUnit(unitNumber, levelNumber)
    ? right(response)
    : left(`AddressValidatorV4:\t unit number is not valid`)
}

const addressLevelNumberValidatorV4: ResponseValidator<AddressResponseV4> = (
  response,
) => {
  const unitNumber = response.answer.unitNumber.value
  const levelNumber = response.answer.levelNumber.value
  const validLevelNumber = levelNumber
    ? validateNoNonNumerical(levelNumber)
    : true
  return validLevelNumber && validateLevelUnit(levelNumber, unitNumber)
    ? right(response)
    : left(`AddressValidatorV4:\t level number is not valid`)
}

export const constructAddressValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
  ParsedClearFormFieldResponseV4,
  AddressResponseV4
> = () =>
  flow(
    isAddressResponseV4,
    chain(addressPostalCodeValidatorV4),
    chain(addressBlockNumberValidatorV4),
    chain(addressLevelNumberValidatorV4),
    chain(addressUnitNumberValidatorV4),
  )

export const constructOptionalAddressValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAddressCompoundFieldSchema>,
  ParsedClearFormFieldResponseV4,
  AddressResponseV4
> = () =>
  flow(
    isAddressResponseV4,
    chain(addressLevelNumberValidatorV4),
    chain(addressUnitNumberValidatorV4),
  )
