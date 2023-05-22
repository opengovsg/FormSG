import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import { BasicField } from '../../../../../../shared/types'

describe('Yes/No field validation', () => {
  it('should allow yes', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Yes',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow no', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid input', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Some answer',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
