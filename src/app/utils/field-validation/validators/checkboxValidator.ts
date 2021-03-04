import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedCheckboxResponse } from 'src/app/modules/submission/submission.types'
import { ICheckboxField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { isOtherOption } from './options'

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

  if (!validateByValue || !customMin) return right(response)

  return answerArray.length >= customMin
    ? right(response)
    : left(
        `CheckboxValidator:\t answer has less options selected than minimum specified`,
      )
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

  if (!validateByValue || !customMax) return right(response)

  return answerArray.length <= customMax
    ? right(response)
    : left(
        `CheckboxValidator:\t answer has more options selected than maximum specified`,
      )
}

/**
 * Returns a validation function to check if the
 * answers are all either within the specified field options or
 * have the correct format for 'others' answer, if others is enabled
 */
const validOptionsValidator: CheckboxValidatorConstructor = (checkboxField) => (
  response,
) => {
  const { fieldOptions, othersRadioButton } = checkboxField
  const { answerArray } = response

  return answerArray.every(
    (answer) =>
      fieldOptions.includes(answer) || isOtherOption(othersRadioButton, answer),
  )
    ? right(response)
    : left(`CheckboxValidator:\t answer is not valid`)
}

/**
 * Returns a validation function to check if there are any
 * duplicates amongst the non-others answers.
 */
const duplicateNonOtherOptionsValidator: CheckboxValidatorConstructor = (
  checkboxField,
) => (response) => {
  const { othersRadioButton } = checkboxField
  const { answerArray } = response

  const nonOtherAnswers = answerArray.filter(
    (answer) => !isOtherOption(othersRadioButton, answer),
  )

  return nonOtherAnswers.length === new Set(nonOtherAnswers).size
    ? right(response)
    : left(`CheckboxValidator:\t duplicate non-other answers in response`)
}

/**
 * Returns a validation function to check if there are any
 * duplicates amongst the others answers, or if there are more
 * than one others answer.
 *
 * Note that it is possible for Admins to create fieldOptions that
 * look like ['Option 1', 'Others: please elaborate']
 *
 */
const duplicateOtherOptionsValidator: CheckboxValidatorConstructor = (
  checkboxField,
) => (response) => {
  const { fieldOptions, othersRadioButton } = checkboxField
  const { answerArray } = response

  const otherAnswers = answerArray.filter((answer) =>
    isOtherOption(othersRadioButton, answer),
  )

  // First check the answers which do not appear in fieldOptions.
  // There should be at most one.

  const otherAnswersNotInFieldOptions = otherAnswers.filter(
    (answer) => !fieldOptions.includes(answer),
  )

  if (otherAnswersNotInFieldOptions.length > 1) {
    return left(`CheckboxValidator:\t duplicate other answers in response`)
  }

  // Next check that for the remaining answers which do appear in fieldOptions,
  // Either there should no duplicates, OR
  // There should be at most 1 duplicate and otherAnswersNotInFieldOptions.length === 0
  // i.e. the 'Others' field is used for the duplicate response.

  const otherAnswersInFieldOptions = otherAnswers.filter((answer) =>
    fieldOptions.includes(answer),
  )

  const numDuplicates =
    otherAnswersInFieldOptions.length - new Set(otherAnswersInFieldOptions).size

  if (numDuplicates > 1) {
    return left(`CheckboxValidator:\t duplicate other answers in response`)
  } else if (numDuplicates === 1 && otherAnswersInFieldOptions.length !== 0) {
    return left(`CheckboxValidator:\t duplicate other answers in response`)
  } else {
    return right(response)
  }
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
    chain(validOptionsValidator(checkboxField)),
    chain(duplicateNonOtherOptionsValidator(checkboxField)),
    chain(duplicateOtherOptionsValidator(checkboxField)),
  )
