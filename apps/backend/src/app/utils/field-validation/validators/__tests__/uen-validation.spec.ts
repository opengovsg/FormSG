import { generateDefaultFieldV4 } from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'formsg-shared/types'

import { ValidateFieldErrorV4 } from 'src/app/modules/submission/submission.errors'
import { validateFieldV4 } from 'src/app/utils/field-validation'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

describe('Uen field validation V4', () => {
  const makeUenResponseV4 = (answer: {
    value: string
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Uen,
      question: 'Uen',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow valid UEN', () => {
    const formField = generateDefaultFieldV4(BasicField.Uen)
    const response = makeUenResponseV4({ value: '53308948D' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid UEN', () => {
    const formField = generateDefaultFieldV4(BasicField.Uen)
    const response = makeUenResponseV4({ value: 'notavaliduen' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })

    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Invalid answer submitted'),
    )
  })

  it('should allow empty string for not required UEN', () => {
    const formField = generateDefaultFieldV4(BasicField.Uen, {
      required: false,
    })
    const response = makeUenResponseV4({ value: '' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string for required UEN', () => {
    const formField = generateDefaultFieldV4(BasicField.Uen, {
      required: true,
    })
    const response = makeUenResponseV4({ value: '' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV4(BasicField.Uen)
    const response = makeUenResponseV4({ value: '53308948D' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4(
        'Attempted to submit response on a hidden field',
      ),
    )
  })
})
