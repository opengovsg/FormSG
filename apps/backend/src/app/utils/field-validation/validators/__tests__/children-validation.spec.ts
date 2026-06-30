import {
  generateDefaultField,
  generateDefaultFieldV3,
} from '__tests__/unit/backend/helpers/generate-form-data'
import {
  BasicField,
  ChildBirthRecordsResponseV3,
  ChildrenFieldVersion,
  MyInfoChildAttributes,
} from 'formsg-shared/types'
import { mongo as mongodb } from 'mongoose'

import { ProcessedChildrenResponse } from 'src/app/modules/submission/submission.types'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

const { ObjectId } = mongodb

const processedChildrenResponse = (
  answerArray: string[][],
): ProcessedChildrenResponse => ({
  _id: new ObjectId().toHexString(),
  question: 'Children',
  fieldType: BasicField.Children,
  isVisible: true,
  answerArray,
  childSubFieldsArray: SUBFIELDS,
})

const SUBFIELDS = [
  MyInfoChildAttributes.ChildName,
  MyInfoChildAttributes.ChildBirthCertNo,
  MyInfoChildAttributes.ChildGender,
  MyInfoChildAttributes.ChildRace,
]

const childrenResponse = (child: string[][]): ChildBirthRecordsResponseV3 => ({
  fieldType: BasicField.Children,
  answer: { child, childFields: SUBFIELDS },
})

describe('Children validation V3', () => {
  const formId = new ObjectId().toHexString()

  describe('empty optional sub-field', () => {
    // A selected child whose optional sub-field (here: race) MyInfo returns
    // empty. This is the original empty-mandatory-sub-field error.
    const selectedChildWithEmptyRace = childrenResponse([
      ['Tan Wen Jie', 'S1234567A', 'MALE', ''],
    ])

    it('allows an empty optional sub-field for a version-2 field', () => {
      const formField = generateDefaultFieldV3(BasicField.Children, {
        childrenSubFields: SUBFIELDS,
        version: ChildrenFieldVersion.V2,
      })

      const result = validateFieldV3({
        formId,
        formField,
        response: selectedChildWithEmptyRace,
        isVisible: true,
      })

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(true)
    })

    it('still rejects an empty sub-field for a legacy (unversioned) field', () => {
      const formField = generateDefaultFieldV3(BasicField.Children, {
        childrenSubFields: SUBFIELDS,
      })

      const result = validateFieldV3({
        formId,
        formField,
        response: selectedChildWithEmptyRace,
        isVisible: true,
      })

      expect(result.isErr()).toBe(true)
    })
  })

  it('accepts a fully populated version-2 child', () => {
    const formField = generateDefaultFieldV3(BasicField.Children, {
      childrenSubFields: SUBFIELDS,
      version: ChildrenFieldVersion.V2,
    })

    const result = validateFieldV3({
      formId,
      formField,
      response: childrenResponse([
        ['Tan Wen Jie', 'S1234567A', 'MALE', 'CHINESE'],
      ]),
      isVisible: true,
    })

    expect(result.isOk()).toBe(true)
  })

  // Storage-mode (Encrypt) submissions are validated through the non-V3
  // `validateField` path, so the empty-optional fix must hold here too.
  describe('non-V3 path (storage submissions)', () => {
    const selectedChildWithEmptyRace = processedChildrenResponse([
      ['Tan Wen Jie', 'S1234567A', 'MALE', ''],
    ])

    it('allows an empty optional sub-field for a version-2 field', () => {
      const formField = generateDefaultField(BasicField.Children, {
        childrenSubFields: SUBFIELDS,
        version: ChildrenFieldVersion.V2,
      })

      const result = validateField(
        formId,
        formField,
        selectedChildWithEmptyRace,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(true)
    })

    it('still rejects an empty sub-field for a legacy (unversioned) field', () => {
      const formField = generateDefaultField(BasicField.Children, {
        childrenSubFields: SUBFIELDS,
      })

      const result = validateField(
        formId,
        formField,
        selectedChildWithEmptyRace,
      )

      expect(result.isErr()).toBe(true)
    })
  })
})
