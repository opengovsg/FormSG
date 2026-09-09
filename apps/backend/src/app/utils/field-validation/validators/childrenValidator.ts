import { ChildrenAnswerV4 } from '@opengovsg/formsg-sdk'
import { MAX_CHILDREN_PER_FIELD } from 'formsg-shared/constants/field/myinfo'
import {
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
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
 * Returns a validator to check that at most one child was answered. Keyed on
 * MAX_CHILDREN_PER_FIELD, not the legacy `allowMultiple` flag, which survives
 * unmigrated on existing form documents and must not grant a second child.
 */
const validSingleChild: ChildrenValidator = (response) => {
  const { answerArray } = response

  return answerArray.length <= MAX_CHILDREN_PER_FIELD
    ? right(response)
    : left(
        `ChildrenValidator (validSingleChild):\t more than ${MAX_CHILDREN_PER_FIELD} child answered`,
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
    chain(validSingleChild),
    chain(validChildAnswerFirstArray),
    chain(validChildAnswerConsistency),
    chain(validChildAnswersNonEmpty),
    chain(validChildAnswerAndSubFields),
    chain(validChildSubFieldsValidator(childrenField)),
    chain(validChildSubFieldsAndResponseSubFieldsMatch(childrenField)),
    chain(validChildSubFieldsResponseValidator),
  )

// V4

type ChildrenValidatorV4 = ResponseValidator<ParsedClearFormFieldResponseV4>
type ChildrenValidatorV4Constructor = (
  childrenField: ChildrenCompoundFieldBase,
) => ChildrenValidatorV4

const asChildrenAnswerV4 = (
  response: ParsedClearFormFieldResponseV4,
): ChildrenAnswerV4 => response.answer as ChildrenAnswerV4

/**
 * Returns a validator to check that at most one child was answered. Same
 * invariant as the V3 validator's `validSingleChild`, keyed on
 * MAX_CHILDREN_PER_FIELD, over the V4 keyed-map shape's own keys.
 */
const validSingleChildV4: ChildrenValidatorV4 = (response) => {
  const answer = asChildrenAnswerV4(response)

  return Object.keys(answer).length <= MAX_CHILDREN_PER_FIELD
    ? right(response)
    : left(
        `ChildrenValidatorV4 (validSingleChildV4):\t more than ${MAX_CHILDREN_PER_FIELD} child answered`,
      )
}

/**
 * Returns a validation function to check that all sub-answers of the single
 * child entry are non-empty once any of them is filled in. Mirrors V3's
 * `validChildAnswersNonEmpty`; the V4 shape has no separate "no child
 * selected" placeholder row, so a child entry with every sub-answer blank is
 * exactly that case.
 */
const validChildAnswersNonEmptyV4: ChildrenValidatorV4 = (response) => {
  const answer = asChildrenAnswerV4(response)
  const childEntries = Object.values(answer)

  return childEntries.every((child) => {
    const subAnswers = Object.values(child.value)
    const noChildSelected = subAnswers.every(
      (subField) => subField.value.trim() === '',
    )
    return (
      noChildSelected ||
      subAnswers.every(
        (subField) =>
          typeof subField.value === 'string' && !!subField.value.trim(),
      )
    )
  })
    ? right(response)
    : left(
        `ChildrenValidatorV4 (validChildAnswersNonEmptyV4):\t inconsistent child sub-answers`,
      )
}

/**
 * Returns a validation function to check if there are invalid subfields
 * given for children. Mirrors V3's `validChildSubFieldsValidator`.
 */
const validChildSubFieldsValidatorV4: ChildrenValidatorV4Constructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField

    const attrs = new Set(Object.values(MyInfoChildAttributes))
    return (childrenSubFields ?? []).every((subfield) => attrs.has(subfield))
      ? right(response)
      : left(
          `ChildrenValidatorV4 (validChildSubFieldsValidatorV4):\t one or more subfields are invalid`,
        )
  }

/**
 * Returns a validation function to check that every child entry's sub-answer
 * keys are exactly the field's configured subfields, no more and no fewer.
 * Mirrors V3's `validChildSubFieldsAndResponseSubFieldsMatch` and
 * `validChildSubFieldsResponseValidator`, collapsed into one check since the
 * V4 shape keys sub-answers by name rather than by parallel array position.
 */
const validChildSubFieldsMatchV4: ChildrenValidatorV4Constructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField as ChildrenCompoundFieldBase
    const expected = new Set(childrenSubFields ?? [])
    const answer = asChildrenAnswerV4(response)

    return Object.values(answer).every((child) => {
      const keys = Object.keys(child.value)
      return (
        keys.length === expected.size &&
        keys.every((key) => expected.has(key as MyInfoChildAttributes))
      )
    })
      ? right(response)
      : left(
          `ChildrenValidatorV4 (validChildSubFieldsMatchV4):\t one or more subfields do not match the field's`,
        )
  }

export const constructChildrenValidatorV4: ChildrenValidatorV4Constructor = (
  childrenField,
) =>
  flow(
    validSingleChildV4,
    chain(validChildAnswersNonEmptyV4),
    chain(validChildSubFieldsValidatorV4(childrenField)),
    chain(validChildSubFieldsMatchV4(childrenField)),
  )
