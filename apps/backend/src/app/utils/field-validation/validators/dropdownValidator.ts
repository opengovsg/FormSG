import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { BasicField, DropdownResponseV3 } from '../../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  IDropdownFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { getMyInfoFieldOptions } from '../../../modules/myinfo/myinfo.util'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  notEmptySingleAnswerResponse,
  notEmptySingleAnswerResponseV3,
} from './common'
import { isOneOfOptions } from './options'

type DropdownValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type DropdownValidatorConstructor = (
  dropdownField: OmitUnusedValidatorProps<IDropdownFieldSchema>,
) => DropdownValidator

/**
 * Returns a validation function
 * to check if dropdown selection is one of the options.
 */
const makeDropdownValidator: DropdownValidatorConstructor =
  (dropdownField) => (response) => {
    const { myInfo, fieldOptions } = dropdownField
    // Inject fieldOptions for MyInfo. This is necessary because the
    // client strips out MyInfo data to keep each form submission lightweight
    const validOptions = myInfo?.attr
      ? getMyInfoFieldOptions(myInfo.attr)
      : // TODO #4279: Revisit decision to trim in backend after React rollout is complete
        fieldOptions.map((opt) => opt.trim())
    const { answer } = response
    const trimmedAnswer = answer.trim()
    return isOneOfOptions(validOptions, trimmedAnswer)
      ? right(response)
      : left(`DropdownValidator:\t answer is not a valid dropdown option`)
  }

/**
 * Returns a validation function for a dropdown field when called.
 */
export const constructDropdownValidator: DropdownValidatorConstructor = (
  dropdownField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeDropdownValidator(dropdownField)),
  )

const isDropdownResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  DropdownResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Dropdown) {
    return left(
      `DropdownValidatorV3.fieldTypeMismatch:\tfieldType is not dropdown`,
    )
  }
  return right(response)
}

/**
 * Returns a validation function
 * to check if dropdown selection is one of the options.
 */
const makeDropdownValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDropdownFieldSchema>,
  DropdownResponseV3
> = (dropdownField) => (response) => {
  const { myInfo, fieldOptions } = dropdownField
  // Inject fieldOptions for MyInfo. This is necessary because the
  // client strips out MyInfo data to keep each form submission lightweight
  const validOptions = myInfo?.attr
    ? getMyInfoFieldOptions(myInfo.attr)
    : // TODO #4279: Revisit decision to trim in backend after React rollout is complete
      fieldOptions.map((opt) => opt.trim())
  const { answer } = response
  const trimmedAnswer = answer.trim()
  return isOneOfOptions(validOptions, trimmedAnswer)
    ? right(response)
    : left(`DropdownValidatorV3:\t answer is not a valid dropdown option`)
}

export const constructDropdownValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDropdownFieldSchema>,
  ParsedClearFormFieldResponseV3,
  DropdownResponseV3
> = (dropdownField) =>
  flow(
    isDropdownResponseV3,
    chain(notEmptySingleAnswerResponseV3),
    chain(makeDropdownValidatorV3(dropdownField)),
  )
