import { ValidateFieldError } from 'src/modules/submission/submission.errors'
import { validateField } from 'utils/field-validation'
import { BasicField } from 'src/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

describe('NRIC field validation', () => {
  it('should allow valid NRIC with S prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'S9912345A',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with T prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'T1394524H',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with F prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'F0477844T',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with G prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'G9592927W',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid NRIC with S prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'S9912345B',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with T prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'T1394524I',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with F prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'F0477844U',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with G prefix', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'G9592927X',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty string for optional NRIC', () => {
    const formField = generateDefaultField(BasicField.Nric, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string for required NRIC', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Nric)
    const response = generateNewSingleAnswerResponse(BasicField.Nric, {
      answer: 'S9912345A',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
