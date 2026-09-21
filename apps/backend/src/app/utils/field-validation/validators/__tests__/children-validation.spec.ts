import {
  generateDefaultField,
  generateDefaultFieldV4,
} from '__tests__/unit/backend/helpers/generate-form-data'
import type { ChildrenAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { ValidateFieldErrorV4 } from 'src/app/modules/submission/submission.errors'
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

describe('Children field validation V4', () => {
  const generateChildrenFieldV4 = (
    customParams?: Partial<ChildrenCompoundFieldBase>,
  ) =>
    generateDefaultFieldV4(BasicField.Children, {
      childrenSubFields: SUBFIELDS,
      ...customParams,
    })

  const makeChildrenResponseV4 = (
    answer: unknown,
  ): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Children,
      question: 'Children',
      answer: answer as ChildrenAnswerV4,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  const VALID_SINGLE_CHILD_ANSWER: ChildrenAnswerV4 = {
    child0: {
      value: {
        [MyInfoChildAttributes.ChildName]: {
          value: 'Phua Chu King',
          myInfo: { attr: MyInfoChildAttributes.ChildName },
        },
        [MyInfoChildAttributes.ChildBirthCertNo]: {
          value: 'T1234567X',
          myInfo: { attr: MyInfoChildAttributes.ChildBirthCertNo },
        },
      },
    },
  }

  const act = (
    formField = generateChildrenFieldV4(),
    answer: unknown = VALID_SINGLE_CHILD_ANSWER,
  ) =>
    validateFieldV4({
      formId: 'formId',
      formField,
      response: makeChildrenResponseV4(answer),
      isVisible: true,
    })

  it('should accept a valid single child answer', () => {
    const validateResult = act()

    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should accept an answer without myInfo meta on subfields', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu King' },
          [MyInfoChildAttributes.ChildBirthCertNo]: { value: 'T1234567X' },
        },
      },
    })

    expect(validateResult.isOk()).toBe(true)
  })

  it('should reject an answer with no child entries when field is required', () => {
    const validateResult = act(generateChildrenFieldV4(), {})

    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Invalid answer submitted'),
    )
  })

  it('should skip validation of an empty answer when field is optional', () => {
    const validateResult = act(generateChildrenFieldV4({ required: false }), {})

    expect(validateResult.isOk()).toBe(true)
  })

  it('should reject a non-object answer', () => {
    const validateResult = act(generateChildrenFieldV4(), 'not-an-object')

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject more than one child', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      ...VALID_SINGLE_CHILD_ANSWER,
      child1: {
        value: {
          [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu Beng' },
          [MyInfoChildAttributes.ChildBirthCertNo]: { value: 'T7654321X' },
        },
      },
    })

    expect(validateResult.isErr()).toBe(true)
  })

  // allowMultiple survives on existing form documents (v2.0 does not migrate
  // them), so it must no longer buy a second child.
  it('should reject more than one child even when the legacy allowMultiple flag is set', () => {
    const validateResult = act(
      generateChildrenFieldV4({ allowMultiple: true }),
      {
        ...VALID_SINGLE_CHILD_ANSWER,
        child1: {
          value: {
            [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu Beng' },
            [MyInfoChildAttributes.ChildBirthCertNo]: { value: 'T7654321X' },
          },
        },
      },
    )

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject an answer missing one of the field subfields', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu King' },
        },
      },
    })

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject an answer with an extraneous subfield', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {
        value: {
          ...VALID_SINGLE_CHILD_ANSWER.child0.value,
          [MyInfoChildAttributes.ChildGender]: { value: 'MALE' },
        },
      },
    })

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject an answer with an empty subfield value', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu King' },
          [MyInfoChildAttributes.ChildBirthCertNo]: { value: '   ' },
        },
      },
    })

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject a malformed child entry without a value record', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {},
    })

    expect(validateResult.isErr()).toBe(true)
  })

  it('should reject a subfield whose myInfo attr does not match its key', () => {
    const validateResult = act(generateChildrenFieldV4(), {
      child0: {
        value: {
          [MyInfoChildAttributes.ChildName]: {
            value: 'Phua Chu King',
            myInfo: { attr: MyInfoChildAttributes.ChildBirthCertNo },
          },
          [MyInfoChildAttributes.ChildBirthCertNo]: {
            value: 'T1234567X',
            myInfo: { attr: MyInfoChildAttributes.ChildBirthCertNo },
          },
        },
      },
    })

    expect(validateResult.isErr()).toBe(true)
  })

  // Secondary Race is removed builder-forward only, so existing forms that
  // still collect it must keep validating.
  it('should still validate an existing form that collects secondary race', () => {
    const legacySubFields = [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildSecondaryRace,
    ]
    const validateResult = act(
      generateChildrenFieldV4({ childrenSubFields: legacySubFields }),
      {
        child0: {
          value: {
            [MyInfoChildAttributes.ChildName]: { value: 'Phua Chu King' },
            [MyInfoChildAttributes.ChildSecondaryRace]: { value: 'CHINESE' },
          },
        },
      },
    )

    expect(validateResult.isOk()).toBe(true)
  })
})
