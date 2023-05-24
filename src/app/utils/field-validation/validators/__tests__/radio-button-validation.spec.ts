import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import { BasicField } from '../../../../../../shared/types'

describe('Radio button validation', () => {
  it('should allow valid option', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'a',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid option', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'invalid',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty option when it is required', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty option when not required', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty option when required and that logic field is not visible', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: '',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty option when required and that it is visible', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty option when not required and that it is visible', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'a',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it(`should allow answer that starts with 'Others: ' when others option is selected`, () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'Others: hi i am others',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it(`should disallow answer that starts with 'Others: ' when others option is not selected`, () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'Others: hi i am others',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it(`should disallow empty answer when others option is selected`, () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Radio, {
      answer: 'a',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
