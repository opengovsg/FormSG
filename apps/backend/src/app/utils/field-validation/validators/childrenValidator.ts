import type { ChildrenAnswerV4 } from '@opengovsg/formsg-sdk'
import { MAX_CHILDREN_PER_FIELD } from 'formsg-shared/constants/field/myinfo'
import {
  BasicField,
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
import { validateResponseShapeV4 } from '../response-shape-validator'

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

const isChildrenFieldTypeV4: ChildrenValidatorV4 = (response) =>
  response.fieldType === BasicField.Children
    ? right(response)
    : left(`ChildrenValidatorV4.fieldTypeMismatch:\tfield type is not children`)

const childrenAnswerNotEmptyValidatorV4: ChildrenValidatorV4 = (response) =>
  Object.keys(response.answer).length > 0
    ? right(response)
    : left(
        `ChildrenValidatorV4 (childrenAnswerNotEmptyValidatorV4):\t answer has no child entries`,
      )

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
    isChildrenFieldTypeV4,
    chain(validateResponseShapeV4),
    chain(childrenAnswerNotEmptyValidatorV4),
    chain(validSingleChildV4),
    chain(validChildSubFieldsValidatorV4(childrenField)),
    chain(validChildAnswerMatchesSubFieldsV4(childrenField)),
    chain(validChildAnswersNonEmptyV4),
    chain(validChildSubFieldMyInfoAttrsV4),
  )
