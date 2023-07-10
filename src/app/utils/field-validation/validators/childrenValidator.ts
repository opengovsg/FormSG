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
    ? left(`CheckboxValidator:\t Answer is empty array`)
    : right(response)
}

/**
 * Returns a validation function to check if the
 * that the first answer subarray has length > 0.
 */
const validChildAnswerFirstArray: ChildrenValidator = (response) => {
  const { answerArray } = response
  const len = answerArray[0]?.length
  return len !== undefined && len > 0
    ? right(response)
    : left(`CheckboxValidator:\t first subarray length is invalid`)
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
    : left(`CheckboxValidator:\t inconsistent answer array subarrays`)
}

/**
 * Returns a validation function to check if the
 * answerArray and subFields array are equal length.
 */
const validChildAnswerAndSubFields: ChildrenValidator = (response) => {
  const { childSubFieldsArray, answerArray } = response

  return childSubFieldsArray.length === answerArray[0].length
    ? right(response)
    : left(
        `CheckboxValidator:\t inconsistent child subfield and answer array length`,
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
      : left(`CheckboxValidator:\t one or more subfields are invalid`)
  }

/**
 * Returns a validation function to check if there are
 * invalid subfields given for children.
 */
const validChildSubFieldsResponseValidator: ChildrenValidator = (response) => {
  const { childSubFieldsArray } = response

  const attrs = new Set(Object.values(MyInfoChildAttributes))
  return childSubFieldsArray.every((subfield) => attrs.has(subfield))
    ? right(response)
    : left(`CheckboxValidator:\t one or more subfields responses are invalid`)
}

/**
 * Returns a validation function to check if the subfields
 * for both the response and the field itself match.
 */
const validChildSubFieldsAndResponseSubFieldsMatch: ChildrenValidatorConstructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField as ChildrenCompoundFieldBase
    const { childSubFieldsArray } = response

    return childSubFieldsArray.every(
      (subfield, i) => (childrenSubFields ?? [])[i] === subfield,
    )
      ? right(response)
      : left(
          `CheckboxValidator:\t one or more subfields responses do not match the field's`,
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
    chain(validChildAnswerAndSubFields),
    chain(validChildSubFieldsValidator(childrenField)),
    chain(validChildSubFieldsAndResponseSubFieldsMatch(childrenField)),
    chain(validChildSubFieldsResponseValidator),
  )
