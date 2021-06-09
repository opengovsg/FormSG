import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'
import { BasicField } from 'src/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

describe('Dropdown validation', () => {
  it('should allow valid option', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: 'KISS',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid option', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: 'invalid',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty answer when required', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer when it is required but not visible', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: '',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer when it is required and visible', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow multiple answers', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: ['KISS', 'DRY'] as unknown as string,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Response has invalid shape'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: 'KISS',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
