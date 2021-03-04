import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedCheckboxResponse } from 'src/app/modules/submission/submission.types'
import { ICheckboxField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

type CheckboxValidator = ResponseValidator<ProcessedCheckboxResponse>
type CheckboxValidatorConstructor = (
  checkboxField: ICheckboxField,
) => CheckboxValidator

/**
 * Returns a validator to check if answerArray is empty
 */
const checkboxAnswerValidator: CheckboxValidator = (response) => {
  const { answerArray } = response

  return answerArray.length === 0
    ? left(`CheckboxValidator:\t Answer is empty array`)
    : right(response)
}

/**
 * Returns a validation function to check if number of
 * selected checkbox options is less than the minimum number specified.
 */
const minOptionsValidator: CheckboxValidatorConstructor = (checkboxField) => (
  response,
) => {
  const { validateByValue } = checkboxField
  const { customMin } = checkboxField.ValidationOptions
  const { answerArray } = response

  return validateByValue && customMin
    ? answerArray.length >= customMin
      ? right(response)
      : left(
          `CheckboxValidator:\t answer has less options selected than minimum specified`,
        )
    : right(response)
}

/**
 * Returns a validation function to check if number of
 * selected checkbox options is more than the maximum number specified.
 */
const maxOptionsValidator: CheckboxValidatorConstructor = (checkboxField) => (
  response,
) => {
  const { validateByValue } = checkboxField
  const { customMax } = checkboxField.ValidationOptions
  const { answerArray } = response

  return validateByValue && customMax
    ? answerArray.length <= customMax
      ? right(response)
      : left(
          `CheckboxValidator:\t answer has more options selected than maximum specified`,
        )
    : right(response)
}

/**
 * Returns a validation function to check if 'others' is selected
 * and if so, whether the response for 'others' is valid.
 */
const othersOptionValidator: CheckboxValidatorConstructor = (checkboxField) => (
  response,
) => {
  const { othersRadioButton } = checkboxField
  const { answerArray } = response

  if (othersRadioButton) {
    const othersAnswer = answerArray[answerArray.length - 1]
    const othersText = 'Others: '
    return othersAnswer.startsWith(othersText) &&
      othersAnswer.trim().length > othersText.length // not a blank answer
      ? right(response)
      : left(`CheckboxValidator:\t answer for Others is invalid`)
  }

  return right(response)
}

/**
 * Returns a validation function to check if there are any
 * duplicates amongst the answers.
 */
const duplicateOptionsValidator: CheckboxValidatorConstructor = (
  checkboxField,
) => (response) => {
  const { othersRadioButton } = checkboxField
  const { answerArray } = response

  // Exclude 'Others' response if selected
  // As non-others option are allowed to start with 'Others: '.
  const answersToCheck = othersRadioButton
    ? answerArray.slice(0, -1)
    : answerArray

  return answersToCheck.length === new Set(answersToCheck).size
    ? right(response)
    : left(`CheckboxValidator:\t duplicate answers in response`)
}

/**
 * Returns a validation function to check if the
 * answers are all within the specified field options
 */
const validOptionsValidator: CheckboxValidatorConstructor = (checkboxField) => (
  response,
) => {
  const { fieldOptions, othersRadioButton } = checkboxField
  const { answerArray } = response

  // Exclude 'Others' response if selected
  // as this does not need to be one of the pre-defined options
  const answersToCheck = othersRadioButton
    ? answerArray.slice(0, -1)
    : answerArray

  return answersToCheck.every((answer) => fieldOptions.includes(answer))
    ? right(response)
    : left(`CheckboxValidator:\t answer not in fieldoptions`)
}

/**
 * Returns a validation function for a checkbox field when called.
 */
export const constructCheckboxValidator: CheckboxValidatorConstructor = (
  checkboxField,
) =>
  flow(
    checkboxAnswerValidator,
    chain(minOptionsValidator(checkboxField)),
    chain(maxOptionsValidator(checkboxField)),
    chain(othersOptionValidator(checkboxField)),
    chain(duplicateOptionsValidator(checkboxField)),
    chain(validOptionsValidator(checkboxField)),
  )
