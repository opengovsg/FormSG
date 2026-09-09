import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { ChildrenAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  ChildrenCompoundFieldBase,
  FormFieldDto,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { ProcessedChildrenResponse } from 'src/app/modules/submission/submission.types'
import { validateField, validateFieldV4 } from 'src/app/utils/field-validation'
import { FieldValidationSchema } from 'src/types'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

const SUBFIELDS = [
  MyInfoChildAttributes.ChildName,
  MyInfoChildAttributes.ChildBirthCertNo,
]

const generateChildrenField = (
  customParams?: Partial<ChildrenCompoundFieldBase>,
) =>
  generateDefaultField(BasicField.Children, {
    childrenSubFields: SUBFIELDS,
    ...customParams,
  }) as FieldValidationSchema

const generateChildrenResponse = (
  formField: FieldValidationSchema,
  answerArray: string[][],
  childSubFieldsArray: MyInfoChildAttributes[] = SUBFIELDS,
): ProcessedChildrenResponse =>
  ({
    _id: formField._id,
    question: 'Child',
    fieldType: BasicField.Children,
    answerArray,
    childSubFieldsArray,
    isVisible: true,
  }) as unknown as ProcessedChildrenResponse

const TWO_CHILDREN = [
  ['Phua Chu King', 'T1234567X'],
  ['Phua Chu Beng', 'T7654321X'],
]

describe('Children field validation', () => {
  it('should accept a single child', () => {
    const formField = generateChildrenField()
    const response = generateChildrenResponse(formField, [
      ['Phua Chu King', 'T1234567X'],
    ])

    const validateResult = validateField('formId', formField, response)

    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should reject more than one child', () => {
    const formField = generateChildrenField()
    const response = generateChildrenResponse(formField, TWO_CHILDREN)

    const validateResult = validateField('formId', formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  // allowMultiple survives on existing form documents (v2.0 does not migrate
  // them), so it must no longer buy a second child.
  it('should reject more than one child even when the legacy allowMultiple flag is set', () => {
    const formField = generateChildrenField({ allowMultiple: true })
    const response = generateChildrenResponse(formField, TWO_CHILDREN)

    const validateResult = validateField('formId', formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  // Secondary Race is removed builder-forward only, so existing forms that
  // still collect it must keep validating.
  it('should still validate an existing form that collects secondary race', () => {
    const legacySubFields = [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildSecondaryRace,
    ]
    const formField = generateChildrenField({
      childrenSubFields: legacySubFields,
    })
    const response = generateChildrenResponse(
      formField,
      [['Phua Chu King', 'CHINESE']],
      legacySubFields,
    )

    const validateResult = validateField('formId', formField, response)

    expect(validateResult.isOk()).toBe(true)
  })
})

describe('Children field validation (V4)', () => {
  const generateChildrenFieldV4 = (
    customParams?: Partial<ChildrenCompoundFieldBase>,
  ) =>
    generateDefaultField(BasicField.Children, {
      childrenSubFields: SUBFIELDS,
      ...customParams,
    }) as FormFieldDto

  const generateChildrenResponseV4 = (
    formField: FormFieldDto,
    answer: ChildrenAnswerV4,
  ): ParsedClearFormFieldResponseV4 =>
    ({
      _id: formField._id,
      question: 'Child',
      fieldType: BasicField.Children,
      answer,
      provenance: {},
      isVisible: true,
    }) as unknown as ParsedClearFormFieldResponseV4

  const buildChild = (values: string[]): ChildrenAnswerV4['child0'] => ({
    value: Object.fromEntries(
      SUBFIELDS.map((subField, i) => [subField, { value: values[i] }]),
    ),
  })

  const runValidate = (
    formField: FormFieldDto,
    response: ParsedClearFormFieldResponseV4,
  ) =>
    validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })

  it('should accept a single child', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: buildChild(['Phua Chu King', 'T1234567X']),
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isOk()).toBe(true)
  })

  it('should reject more than one child', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: buildChild(['Phua Chu King', 'T1234567X']),
      child1: buildChild(['Phua Chu Beng', 'T7654321X']),
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  it('should accept a single child sourced from a sponsored MyInfo record', () => {
    // Sponsored children are merged into the same picker as birth records
    // (see myinfo.adapter.ts), so the field validator never sees a
    // "sponsored" marker — only whichever one child was picked, same shape
    // either way.
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: {
            value: 'Sponsored Child',
            myInfo: { attr: MyInfoChildAttributes.ChildName },
          },
          [MyInfoChildAttributes.ChildBirthCertNo]: {
            value: 'T1234567X',
            myInfo: { attr: MyInfoChildAttributes.ChildBirthCertNo },
          },
        },
      },
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isOk()).toBe(true)
  })

  it('should reject a child missing one of the configured subfields', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu King' },
        },
      },
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject a child with an extra subfield beyond the field config', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: {
        value: {
          ...buildChild(['Phua Chu King', 'T1234567X']).value,
          [MyInfoChildAttributes.ChildGender]: { value: 'MALE' },
        },
      },
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject a partially-filled child', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: buildChild(['Phua Chu King', '']),
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isErr()).toBe(true)
  })

  it('should accept no child selected', () => {
    const formField = generateChildrenFieldV4()
    const response = generateChildrenResponseV4(formField, {
      child0: buildChild(['', '']),
    })

    const validateResult = runValidate(formField, response)

    expect(validateResult.isOk()).toBe(true)
  })
})
