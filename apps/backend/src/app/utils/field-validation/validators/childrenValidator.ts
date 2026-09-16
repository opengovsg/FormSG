import type {
  ChildEntryV4,
  ChildrenAnswerV4,
  ChildSubFieldAnswerV4,
} from '@opengovsg/formsg-sdk'
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

const isChildSubFieldAnswerV4 = (
  subFieldAnswer: unknown,
): subFieldAnswer is ChildSubFieldAnswerV4 =>
  typeof subFieldAnswer === 'object' &&
  subFieldAnswer !== null &&
  typeof (subFieldAnswer as { value: unknown }).value === 'string'

/**
 * Checks the answer is a ChildrenAnswerV4-shaped object with at least one
 * child entry, each carrying a `value` record of subfield answers.
 * V3 counterpart: childrenAnswerValidator + validChildAnswerFirstArray.
 */
const childrenAnswerShapeValidatorV4: ChildrenValidatorV4 = (response) => {
  const answer: unknown = response.answer
  if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
    return left(
      `ChildrenValidatorV4 (childrenAnswerShapeValidatorV4):\t answer is not an object`,
    )
  }
  const childEntries = Object.values(answer)
  if (childEntries.length === 0) {
    return left(
      `ChildrenValidatorV4 (childrenAnswerShapeValidatorV4):\t answer has no child entries`,
    )
  }
  const everyEntryValid = childEntries.every(
    (entry: unknown) =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as ChildEntryV4).value === 'object' &&
      (entry as ChildEntryV4).value !== null &&
      Object.values((entry as ChildEntryV4).value).every(
        isChildSubFieldAnswerV4,
      ),
  )
  return everyEntryValid
    ? right(response)
    : left(
        `ChildrenValidatorV4 (childrenAnswerShapeValidatorV4):\t one or more child entries are malformed`,
      )
}

/**
 * Checks that at most one child was answered. Keyed on
 * MAX_CHILDREN_PER_FIELD, not the legacy `allowMultiple` flag, which survives
 * unmigrated on existing form documents and must not grant a second child.
 * V3 counterpart: validSingleChild.
 */
const validSingleChildV4: ChildrenValidatorV4 = (response) => {
  const answer = response.answer as ChildrenAnswerV4
  return Object.keys(answer).length <= MAX_CHILDREN_PER_FIELD
    ? right(response)
    : left(
        `ChildrenValidatorV4 (validSingleChildV4):\t more than ${MAX_CHILDREN_PER_FIELD} child answered`,
      )
}

/**
 * Checks the field's configured subfields are all valid MyInfo child
 * attributes. V3 counterpart: validChildSubFieldsValidator.
 */
const validChildSubFieldsValidatorV4: ChildrenValidatorV4Constructor =
  (childrenField) => (response) => {
    const { childrenSubFields } = childrenField
    const attrs = new Set<string>(Object.values(MyInfoChildAttributes))
    return (childrenSubFields ?? []).every((subField) => attrs.has(subField))
      ? right(response)
      : left(
          `ChildrenValidatorV4 (validChildSubFieldsValidatorV4):\t one or more subfields are invalid`,
        )
  }

/**
 * Checks each child entry answers exactly the field's configured subfields —
 * no missing and no extraneous attributes. V3 counterparts:
 * validChildAnswerAndSubFields + validChildSubFieldsAndResponseSubFieldsMatch
 * + validChildSubFieldsResponseValidator (V4 keys answers by attribute, so a
 * set comparison against the field subsumes the per-index checks).
 */
const validChildAnswerMatchesSubFieldsV4: ChildrenValidatorV4Constructor =
  (childrenField) => (response) => {
    const fieldSubFields = childrenField.childrenSubFields ?? []
    const answer = response.answer as ChildrenAnswerV4

    const everyChildMatches = Object.values(answer).every((childEntry) => {
      const answeredAttrs = Object.keys(childEntry.value)
      return (
        answeredAttrs.length === fieldSubFields.length &&
        fieldSubFields.every((subField) => subField in childEntry.value)
      )
    })
    return everyChildMatches
      ? right(response)
      : left(
          `ChildrenValidatorV4 (validChildAnswerMatchesSubFieldsV4):\t one or more child answers do not match the field's subfields`,
        )
  }

/**
 * Checks every subfield answer is non-empty. Unlike V3 there is no
 * "no child selected" carve-out: the FE omits the whole field from the V4
 * payload when no child is selected, so a present answer must be complete.
 * V3 counterpart: validChildAnswersNonEmpty.
 */
const validChildAnswersNonEmptyV4: ChildrenValidatorV4 = (response) => {
  const answer = response.answer as ChildrenAnswerV4
  return Object.values(answer).every((childEntry) =>
    Object.values(childEntry.value).every(
      (subFieldAnswer) => !!subFieldAnswer.value.trim(),
    ),
  )
    ? right(response)
    : left(
        `ChildrenValidatorV4 (validChildAnswersNonEmptyV4):\t one or more subfield answers are empty`,
      )
}

/**
 * Checks that any myInfo meta on a subfield answer names the attribute it is
 * keyed under, so a response cannot claim MyInfo provenance for a different
 * attribute.
 */
const validChildSubFieldMyInfoAttrsV4: ChildrenValidatorV4 = (response) => {
  const answer = response.answer as ChildrenAnswerV4
  return Object.values(answer).every((childEntry) =>
    Object.entries(childEntry.value).every(
      ([attr, subFieldAnswer]) =>
        !subFieldAnswer.myInfo || subFieldAnswer.myInfo.attr === attr,
    ),
  )
    ? right(response)
    : left(
        `ChildrenValidatorV4 (validChildSubFieldMyInfoAttrsV4):\t subfield myInfo attr does not match its key`,
      )
}

/**
 * Returns a validation function for a children field response in V4 shape
 * (see ChildrenAnswerV4), porting the V3 validator's rules.
 */
export const constructChildrenValidatorV4: ChildrenValidatorV4Constructor = (
  childrenField,
) =>
  flow(
    childrenAnswerShapeValidatorV4,
    chain(validSingleChildV4),
    chain(validChildSubFieldsValidatorV4(childrenField)),
    chain(validChildAnswerMatchesSubFieldsV4(childrenField)),
    chain(validChildAnswersNonEmptyV4),
    chain(validChildSubFieldMyInfoAttrsV4),
  )
