import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import _ from 'lodash'

import {
  BasicField,
  ChildBirthRecordsResponseV3,
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from '../../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../../types/api'
import {
  IChildrenCompoundFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
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

const isChildBirthRecordsResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  ChildBirthRecordsResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Children) {
    return left(
      `ChildrenValidatorV3.fieldTypeMismatch:\t fieldType is not children`,
    )
  }
  return right(response)
}

/**
 * Returns a validator to check that the answer.child array is not empty
 */
const isChildAnswerNonEmptyV3: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { child } = response.answer

  return child.length === 0
    ? left(
        `ChildrenValidatorV3.childrenAnswerValidator:\t answer.child is empty array`,
      )
    : right(response)
}

/**
 * Returns a validation function to check if the
 * the first array type element of answer.child has length > 0.
 */
const isChildFirstElementLengthGtZeroV3: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { child } = response.answer
  const first = child[0]
  return Array.isArray(first) && first.length > 0
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildAnswerFirstArray:\t array length of first element of answer.child is invalid`,
      )
}

/**
 * Returns a validation function to check if the
 * array type elements of answer.child are all equal length.
 */
const isChildElementsSameLengthV3: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { child } = response.answer
  const len = child[0].length

  return child.every((subArr) => subArr.length === len)
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildSameAnswerLengthV3:\t array length of answer.child elmements are not the same`,
      )
}

/**
 * Returns a validation function to check if
 * all the answers are non-empty if the child answer does not represent no child being selected.
 */
const isValidChildAnswersNonEmpty: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { childFields, child } = response.answer

  const numChildrenSubFields = childFields?.length ?? 1
  const noChildSelectedAnswer = Array(numChildrenSubFields).fill('')

  const isNoChildSelected =
    child.length === 0 ||
    (child.length === 1 && _.isEqual(child[0], noChildSelectedAnswer))

  return isNoChildSelected
    ? right(response)
    : child.every((childAns) =>
          childAns.every(
            (subFieldAns) =>
              typeof subFieldAns === 'string' && !!subFieldAns.trim(),
          ),
        )
      ? right(response)
      : left(
          `ChildrenValidatorV3.validChildAnswersNonEmpty:\t inconsistent answer array subarrays`,
        )
}

/**
 * Returns a validation function to check if the
 * first element in child.answer and childFields array are equal length.
 */
const isChildrenAnswerAndSubfieldSameLengthV3: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { childFields, child } = response.answer

  return childFields?.length === child[0].length
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildAnswerAndSubFields:\t inconsistent child subfield and answer array length`,
      )
}

/**
 * Returns a validation function to check if there are
 * invalid subfields in the form field given for children.
 */
const isSubfieldsValidAttributeV3: ResponseValidatorConstructor<
  ChildrenCompoundFieldBase,
  ChildBirthRecordsResponseV3
> = (childrenField) => (response) => {
  const { childrenSubFields = [] } = childrenField

  const attrs = new Set(Object.values(MyInfoChildAttributes))
  return childrenSubFields.every((subfield) => attrs.has(subfield))
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildSubFieldsValidator:\t one or more subfields are invalid`,
      )
}

/**
 * Returns a validation function to check if there are
 * invalid subfields in the response given for children.
 */
const isChildFieldValidAttributeV3: ResponseValidator<
  ChildBirthRecordsResponseV3
> = (response) => {
  const { childFields } = response.answer

  const attrs = new Set(Object.values(MyInfoChildAttributes))
  return childFields?.every((subfield) => attrs.has(subfield))
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildSubFieldsResponseValidator:\t one or more subfields responses are invalid`,
      )
}

/**
 * Returns a validation function to check if the subfields
 * for both the response and the form field match.
 */
const isChildSubFieldsAndResponseSubFieldsMatchingV3: ResponseValidatorConstructor<
  ChildrenCompoundFieldBase,
  ChildBirthRecordsResponseV3
> = (childrenField) => (response) => {
  const { childrenSubFields = [] } = childrenField as ChildrenCompoundFieldBase
  const { childFields } = response.answer

  return childFields?.every((subfield, i) => childrenSubFields[i] === subfield)
    ? right(response)
    : left(
        `ChildrenValidatorV3.validChildSubFieldsAndResponseSubFieldsMatch:\t one or more subfields responses do not match the field's`,
      )
}

export const constructChildrenValidatorV3: ResponseValidatorConstructor<
  ChildrenCompoundFieldBase,
  ParsedClearFormFieldResponseV3,
  ChildBirthRecordsResponseV3
> = (childrenField) => {
  return flow(
    isChildBirthRecordsResponseV3,
    chain(isChildAnswerNonEmptyV3),
    chain(isChildFirstElementLengthGtZeroV3),
    chain(isChildElementsSameLengthV3),
    chain(isValidChildAnswersNonEmpty),
    chain(isChildrenAnswerAndSubfieldSameLengthV3),
    chain(isChildFieldValidAttributeV3),
    chain(isSubfieldsValidAttributeV3(childrenField)),
    chain(isChildSubFieldsAndResponseSubFieldsMatchingV3(childrenField)),
  )
}
