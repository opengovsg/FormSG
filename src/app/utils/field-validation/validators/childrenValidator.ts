import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import {
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from '../../../../../shared/types'
import {
  IChildrenCompoundFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedChildrenResponse } from '../../../modules/submission/submission.types'

type ChildrenValidator = ResponseValidator<ProcessedChildrenResponse>
type ChildrenValidatorConstructor = (
  checkboxField: OmitUnusedValidatorProps<IChildrenCompoundFieldSchema>,
) => ChildrenValidator

/**
 * Returns a validator to check if answerArray is empty
 */
const childrenAnswerValidator: ChildrenValidator = (response) => {
  const { answerArray } = response

  return answerArray.length === 0
    ? left(
        `ChildrenValidator (childrenAnswerValidator):\t Answer is empty array`,
      )
    : right(response)
}

/**
 * Returns a validation function to check if the
 * that the first answer subarray has length > 0.
 */
const validChildAnswerFirstArray: ChildrenValidator = (response) => {
  const { answerArray } = response
  const first = answerArray[0]
  return Array.isArray(first) && first.length > 0
    ? right(response)
    : left(
        `ChildrenValidator (validChildAnswerFirstArray):\t first subarray length is invalid`,
      )
}

/**
 * Returns a validation function to check if the
 * answerArray subarrays are all equal length.
 */
const validChildAnswerConsistency: ChildrenValidator = (response) => {
  const { answerArray } = response
  const len = answerArray[0].length

  return answerArray.every((subArr) => subArr.length === len)
    ? right(response)
    : left(
        `ChildrenValidator (validChildAnswerConsistency):\t inconsistent answer array subarrays`,
      )
}

/**
 * Returns a validation function to check if
 * all the answers are non-empty if first answer subarray has length > 0 and a child is selected
 */
const validChildAnswersNonEmpty: ChildrenValidator = (response) => {
  const { childSubFieldsArray, answerArray } = response
  const first = answerArray[0]

  // Account for the case where no child is selected
  const noOfChildrenSubFields = childSubFieldsArray?.length ?? 1
  const noChildSelectedAnswerArray = Array(noOfChildrenSubFields).fill('')
  // Similar to transformToChildOutput in inputTransformation, this is a string of empty strings (which represents number of children subfields).
  const noChildSelectedAnswer = noChildSelectedAnswerArray[0]

  return Array.isArray(first) &&
    first.length > 0 &&
    // Check that at least 1 child is selected
    first[0] !== noChildSelectedAnswer
    ? answerArray.every((subArr) =>
        subArr.every((val) => typeof val === 'string' && !!val.trim()),
      )
      ? right(response)
      : left(
          `ChildrenValidator (validChildAnswersNonEmpty):\t inconsistent answer array subarrays`,
        )
    : right(response)
}

/**
 * Returns a validation function to check if the
 * answerArray and subFields array are equal length.
 */
const validChildAnswerAndSubFields: ChildrenValidator = (response) => {
  const { childSubFieldsArray, answerArray } = response

  return childSubFieldsArray?.length === answerArray[0].length
    ? right(response)
    : left(
        `ChildrenValidator (validChildAnswerAndSubFields):\t inconsistent child subfield and answer array length`,
      )
}

/**
 * Returns a validation function to check if there are
 * invalid subfields given for children.
 */
const validChildSubFieldsValidator: ChildrenValidatorConstructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField

    const attrs = new Set(Object.values(MyInfoChildAttributes))
    return childrenSubFields.every((subfield) => attrs.has(subfield))
      ? right(response)
      : left(
          `ChildrenValidator (validChildSubFieldsValidator):\t one or more subfields are invalid`,
        )
  }

/**
 * Returns a validation function to check if there are
 * invalid subfields given for children.
 */
const validChildSubFieldsResponseValidator: ChildrenValidator = (response) => {
  const { childSubFieldsArray } = response

  const attrs = new Set(Object.values(MyInfoChildAttributes))
  return childSubFieldsArray?.every((subfield) => attrs.has(subfield))
    ? right(response)
    : left(
        `ChildrenValidator (validChildSubFieldsResponseValidator):\t one or more subfields responses are invalid`,
      )
}

/**
 * Returns a validation function to check if the subfields
 * for both the response and the field itself match.
 */
const validChildSubFieldsAndResponseSubFieldsMatch: ChildrenValidatorConstructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField as ChildrenCompoundFieldBase
    const { childSubFieldsArray } = response

    return childSubFieldsArray?.every(
      (subfield, i) => (childrenSubFields ?? [])[i] === subfield,
    )
      ? right(response)
      : left(
          `ChildrenValidator (validChildSubFieldsAndResponseSubFieldsMatch):\t one or more subfields responses do not match the field's`,
        )
  }

/**
 * Returns a validation function for a children field when called.
 */
export const constructChildrenValidator: ChildrenValidatorConstructor = (
  childrenField,
) =>
  flow(
    childrenAnswerValidator,
    chain(validChildAnswerFirstArray),
    chain(validChildAnswerConsistency),
    chain(validChildAnswersNonEmpty),
    chain(validChildAnswerAndSubFields),
    chain(validChildSubFieldsValidator(childrenField)),
    chain(validChildSubFieldsAndResponseSubFieldsMatch(childrenField)),
    chain(validChildSubFieldsResponseValidator),
  )
