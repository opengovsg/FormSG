import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'
import { BasicField } from 'src/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from '../../helpers/generate-form-data'

describe('Home phone number validation tests', () => {
  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer for optional field', () => {
    const formField = generateDefaultField(BasicField.HomeNo, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow empty answer for required field', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow valid home numbers for homeno fieldType', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+6563334444',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow home numbers without "+" prefix', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '6563334444',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow mobile numbers on homeno fieldType', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+6598765432',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+441285291028',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow international numbers when field allows for it', () => {
    const formField = generateDefaultField(BasicField.HomeNo, {
      allowIntlNumbers: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+441285291028',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+6565656565',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
