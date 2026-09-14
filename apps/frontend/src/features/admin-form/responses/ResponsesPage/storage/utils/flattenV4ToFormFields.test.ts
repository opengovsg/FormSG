import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'

import {
  BasicField,
  FormFieldDto,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { flattenV4ToFormFields } from './flattenV4ToFormFields'

const CHILDREN_FIELD_ID = 'c'.repeat(24)
const TEXT_FIELD_ID = 'a'.repeat(24)

const childrenField = {
  _id: CHILDREN_FIELD_ID,
  title: 'Children',
  fieldType: BasicField.Children,
  childrenSubFields: [
    MyInfoChildAttributes.ChildName,
    MyInfoChildAttributes.ChildBirthCertNo,
  ],
} as unknown as FormFieldDto

const textField = {
  _id: TEXT_FIELD_ID,
  title: 'Short Text',
  fieldType: BasicField.ShortText,
} as unknown as FormFieldDto

describe('flattenV4ToFormFields', () => {
  it('should flatten generic string answers', () => {
    const result = flattenV4ToFormFields({
      v4Responses: {
        [TEXT_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          question: 'Short Text',
          answer: { value: 'hello' },
          provenance: {},
        },
      } as unknown as FieldResponsesV4,
      formFields: [textField],
    })

    expect(result).toEqual([
      {
        _id: TEXT_FIELD_ID,
        question: 'Short Text',
        fieldType: BasicField.ShortText,
        answer: 'hello',
      },
    ])
  })

  describe('children fields', () => {
    it('should explode an answered children field into per-attribute entries matching encrypt mode', () => {
      const result = flattenV4ToFormFields({
        v4Responses: {
          [CHILDREN_FIELD_ID]: {
            fieldType: BasicField.Children,
            question: 'Children',
            provenance: {},
            answer: {
              child0: {
                value: {
                  // Keyed in reverse of the field subfield order: output must
                  // follow the field definition order, name first.
                  [MyInfoChildAttributes.ChildBirthCertNo]: {
                    value: 'T1234567X',
                  },
                  [MyInfoChildAttributes.ChildName]: {
                    value: 'Phua Chu King',
                  },
                },
              },
            },
          },
        } as unknown as FieldResponsesV4,
        formFields: [childrenField],
      })

      // Same synthetic ids and questions as encrypt mode's exploded storage
      // (getAnswersForChild), so the CSV gets identical per-attribute columns.
      expect(result).toEqual([
        {
          _id: `childrenbirthrecords.${CHILDREN_FIELD_ID}.childname.0`,
          question: 'Child 1 Name',
          fieldType: BasicField.Children,
          answer: 'Phua Chu King',
        },
        {
          _id: `childrenbirthrecords.${CHILDREN_FIELD_ID}.childbirthcertno.0`,
          question: 'Child 1 Birth certificate number',
          fieldType: BasicField.Children,
          answer: 'T1234567X',
        },
      ])
    })

    it('should emit empty per-attribute entries for an unanswered children field', () => {
      const result = flattenV4ToFormFields({
        v4Responses: {} as FieldResponsesV4,
        formFields: [childrenField],
      })

      expect(result).toEqual([
        {
          _id: `childrenbirthrecords.${CHILDREN_FIELD_ID}.childname.0`,
          question: 'Child 1 Name',
          fieldType: BasicField.Children,
          answer: '',
        },
        {
          _id: `childrenbirthrecords.${CHILDREN_FIELD_ID}.childbirthcertno.0`,
          question: 'Child 1 Birth certificate number',
          fieldType: BasicField.Children,
          answer: '',
        },
      ])
    })

    it('should fill a missing subfield answer with an empty string', () => {
      const result = flattenV4ToFormFields({
        v4Responses: {
          [CHILDREN_FIELD_ID]: {
            fieldType: BasicField.Children,
            question: 'Children',
            provenance: {},
            answer: {
              child0: {
                value: {
                  [MyInfoChildAttributes.ChildName]: {
                    value: 'Phua Chu King',
                  },
                },
              },
            },
          },
        } as unknown as FieldResponsesV4,
        formFields: [childrenField],
      })

      expect(result.map((f) => ('answer' in f ? f.answer : undefined))).toEqual(
        ['Phua Chu King', ''],
      )
    })
  })
})
