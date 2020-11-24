import { validateField } from 'src/app/utils/field-validation'
import EmailValidator from 'src/app/utils/field-validation/validators/EmailValidator.class'
import { BasicField } from 'src/types/field/fieldTypes'
import { ISingleAnswerResponse } from 'src/types/response'

import { ValidateFieldError } from '../../../../../dist/backend/app/modules/submission/submission.errors'

describe('Email field validation', () => {
  beforeEach(() => {
    jest
      .spyOn(EmailValidator.prototype, '_isSignatureValid')
      .mockImplementation(() => true)
  })

  it('should allow valid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
    }
    const response: ISingleAnswerResponse = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'valid@email.com',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'invalidemail.com',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: false,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses whose email domain belongs to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      disabled: false,
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'],
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow email addresses whose email domain does not belong to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow any valid email address when isVerifiable is true, hasAllowedEmailDomains is true but allowedEmailDomains is empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: [],
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow any valid email address when isVerifiable is true and hasAllowedEmailDomains is false, regardless of the cardinality of allowedEmailDomains', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
      isVerifiable: true,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com'],
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow any valid email address when isVerifiable is false and hasAllowedEmailDomains is true, regardless of the cardinality of allowedEmailDomains', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      description: 'random',
      required: true,
      disabled: false,
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
})
