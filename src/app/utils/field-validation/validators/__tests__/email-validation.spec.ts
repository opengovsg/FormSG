import formsgSdk from 'src/app/config/formsg-sdk'
import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { validateField } from 'src/app/utils/field-validation'
import { IEmailFieldSchema, OmitUnusedValidatorProps } from 'src/types/field'
import { SingleAnswerFieldResponse } from 'src/types/response'

import { BasicField } from '../../../../../../shared/types'

type VerificationMock = {
  authenticate: () => boolean
}

describe('Email field validation', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })

  it('should allow valid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'valid@email.com',
      isVisible: true,
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow emails with 163.com domain', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'abc@163.com',
      isVisible: true,
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow emails with 126.com domain', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'abc@126.com',
      isVisible: true,
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'invalidemail.com',
      isVisible: true,
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
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
      required: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: false,
      answer: '',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses whose email domain belongs to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
      signature: 'some signature',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses supplied with a mixed-case domain', () => {
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
      allowedEmailDomains: ['@test.gov.sg'], // note: domains are always read lowercased from store
    }
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@TeSt.GoV.Sg', // mixed case domain
      signature: 'some signature',
    } as ISingleAnswerResponse
    const validateResult = validateField(
      'formId',
      formField as unknown as IFieldSchema,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow email addresses whose email domain does not belong to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
      signature: 'some signature',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
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
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: [],
      autoReplyOptions: {
        autoReplyMessage: 'some message',
        autoReplySender: 'some sender',
        autoReplySubject: 'some subject',
        hasAutoReply: true,
        includeFormSummary: true,
      },
    } as OmitUnusedValidatorProps<IEmailFieldSchema>

    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
      signature: 'some signature',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow any valid email address when isVerifiable is true and hasAllowedEmailDomains is false, regardless of the cardinality of allowedEmailDomains', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
      signature: 'some signature',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow any valid email address when isVerifiable is false and hasAllowedEmailDomains is true, regardless of the cardinality of allowedEmailDomains', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'volunteer-testing@test.gov.sg',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: false,
      answer: 'volunteer-testing@test.gov.sg',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })

  it('should reject email addresses if isVerifiable is true but there is no signature present', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'valid@email.com',
      isVisible: true,
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should reject email addresses if isVerifiable is true but signature is invalid', () => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => false)

    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      answer: 'valid@email.com',
      isVisible: true,
      signature: 'some signature',
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField,
      response as ProcessedFieldResponse,
    )
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})
