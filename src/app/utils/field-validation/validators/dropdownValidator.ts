import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import { IDropdownField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { types as myInfoTypes } from '../../../../shared/resources/myinfo'

import { notEmptySingleAnswerResponse } from './common'
import { isOneOfOptions } from './options'

type DropdownValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type DropdownValidatorConstructor = (
  dropdownField: IDropdownField,
) => DropdownValidator

const makeDropdownValidator: DropdownValidatorConstructor = (dropdownField) => (
  response,
) => {
  // Inject fieldOptions for MyInfo. This is necessary because the
  // client strips out MyInfo data to keep each form submission lightweight
  const { myInfo } = dropdownField
  if (myInfo && myInfo.attr) {
    const [myInfoField] = myInfoTypes.filter(
      (type) => type.name === myInfo.attr,
    )
    const { fieldOptions } = myInfoField
    if (fieldOptions) dropdownField.fieldOptions = fieldOptions
  }

  const { fieldOptions } = dropdownField
  const { answer } = response
  return isOneOfOptions(fieldOptions, answer)
    ? right(response)
    : left(`DropdownValidator:\t answer is not a valid dropdown option`)
}

export const constructDropdownValidator: DropdownValidatorConstructor = (
  dropdownField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(makeDropdownValidator(dropdownField)),
  )
