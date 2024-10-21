import {
  generateDefaultFieldV3,
  generateGenericStringAnswerResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'shared/types'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'

import { validateFieldV3 } from '../..'

describe('UEN field validation V3', () => {
  it('should allow valid UEN', () => {
    const formField = generateDefaultFieldV3(BasicField.Uen)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Uen,
      answer: '53308948D',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid UEN', () => {
    const formField = generateDefaultFieldV3(BasicField.Uen)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Uen,
      answer: 'notavaliduen',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })

    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty string for not required UEN', () => {
    const formField = generateDefaultFieldV3(BasicField.Uen, {
      required: false,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Uen,
      answer: '',
    })
    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string for required UEN', () => {
    const formField = generateDefaultFieldV3(BasicField.Uen, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Uen,
      answer: '',
    })
    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.Uen)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Uen,
      answer: '53308948D',
    })
    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
