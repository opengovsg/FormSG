import { StringAnswerV4 } from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
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

import { notEmptySingleAnswerResponse } from './common'
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

// V4

type DropdownResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Dropdown
  answer: StringAnswerV4
}

const isDropdownResponseV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  DropdownResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Dropdown) {
    return left(
      `DropdownValidatorV4.fieldTypeMismatch:\tfieldType is not dropdown`,
    )
  }
  return right(response as DropdownResponseV4)
}

const notEmptyDropdownAnswerV4: ResponseValidator<DropdownResponseV4> = (
  response,
) => {
  if (!response.answer.value || response.answer.value.trim().length === 0) {
    return left(
      'DropdownValidatorV4.notEmpty:\tanswer is an undefined or empty string',
    )
  }
  return right(response)
}

const makeDropdownValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDropdownFieldSchema>,
  DropdownResponseV4
> = (dropdownField) => (response) => {
  const { myInfo, fieldOptions } = dropdownField
  const validOptions = myInfo?.attr
    ? getMyInfoFieldOptions(myInfo.attr)
    : fieldOptions.map((opt) => opt.trim())
  const trimmedAnswer = response.answer.value.trim()
  return isOneOfOptions(validOptions, trimmedAnswer)
    ? right(response)
    : left(`DropdownValidatorV4:\t answer is not a valid dropdown option`)
}

export const constructDropdownValidatorV4: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IDropdownFieldSchema>,
  ParsedClearFormFieldResponseV4,
  DropdownResponseV4
> = (dropdownField) =>
  flow(
    isDropdownResponseV4,
    chain(notEmptyDropdownAnswerV4),
    chain(makeDropdownValidatorV4(dropdownField)),
  )
