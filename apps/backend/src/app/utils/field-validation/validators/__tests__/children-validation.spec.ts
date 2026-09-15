import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import {
  BasicField,
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { ProcessedChildrenResponse } from 'src/app/modules/submission/submission.types'
import { validateField } from 'src/app/utils/field-validation'
import { FieldValidationSchema } from 'src/types'

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
