import {
  generateDefaultFieldV3,
  generateVerifiableAnswerResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'

import formsgSdk from 'src/app/config/formsg-sdk'
import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'
import {
  FieldValidationSchema,
  IEmailFieldSchema,
  OmitUnusedValidatorProps,
} from 'src/types/field'
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
    } as SingleAnswerFieldResponse
    const validateResult = validateField(
      'formId',
      formField as FieldValidationSchema,
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
      disabled: false,
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

  it('should allow any valid email address not in allowedEmailDomains when isVerifiable is true and hasAllowedEmailDomains is false, regardless of the cardinality of allowedEmailDomains', () => {
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

  it('should allow any email address with a domain in allowedEmailDomains when isVerifiable is true and hasAllowedEmailDomains is false, and allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
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

  it('should not allow email address which are not in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is true, if allowedEmailDomains is not empty', () => {
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
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow email address which are in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is true, if allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
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

  it('should allow any valid email address when isVerifiable is false and hasAllowedEmailDomains is true if allowedEmailDomains is empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: [],
      autoReplyOptions: {
        autoReplyMessage: 'some message',
        autoReplySender: 'some sender',
        autoReplySubject: 'some subject',
        hasAutoReply: true,
        includeFormSummary: true,
      },
      disabled: false,
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

  it('should allow any valid email address not in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is false and  allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: false,
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

  it('should allow any valid email address  in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is false and  allowedEmailDomains is not empty', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: false,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
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

describe('Email field validation V3', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })

  it('should allow valid emails', () => {
    const formField = generateDefaultFieldV3(BasicField.Email)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'valid@email.com',
      },
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

  it('should allow emails with 163.com domain', () => {
    const formField = generateDefaultFieldV3(BasicField.Email)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'abc@163.com',
      },
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

  it('should allow emails with 126.com domain', () => {
    const formField = generateDefaultFieldV3(BasicField.Email)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'abc@126.com',
      },
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

  it('should disallow invalid emails', () => {
    const formField = generateDefaultFieldV3(BasicField.Email)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'invalidemail.com',
      },
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

  it('should allow empty answer for required logic field that is not required', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      required: false,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: '',
      },
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

  it('should allow non empty valid answer for required logic field that is not required', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      required: false,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'valid@email.com',
      },
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

  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = generateDefaultFieldV3(BasicField.Email)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: '',
      },
    })
    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses whose email domain belongs to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
        signature: 'some signature',
      },
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

  it('should allow email addresses supplied with a mixed-case domain', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'], // note: domains are always read lowercased from store
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@TeSt.GoV.Sg', // mixed case domain
        signature: 'some signature',
      },
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

  it('should not allow email addresses whose email domain does not belong to allowedEmailDomains when isVerifiable is true, hasAllowedEmailDomains is true and allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
        signature: 'some signature',
      },
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

  it('should allow any valid email address when isVerifiable is true, hasAllowedEmailDomains is true but allowedEmailDomains is empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
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
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
        signature: 'some signature',
      },
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

  it('should allow any valid email address not in allowedEmailDomains when isVerifiable is true and hasAllowedEmailDomains is false, regardless of the cardinality of allowedEmailDomains', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
        signature: 'some signature',
      },
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

  it('should allow any email address with a domain in allowedEmailDomains when isVerifiable is true and hasAllowedEmailDomains is false, and allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
        signature: 'some signature',
      },
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

  it('should not allow email address which are not in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is true, if allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should allow email address which are in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is true, if allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should allow any valid email address when isVerifiable is false and hasAllowedEmailDomains is true if allowedEmailDomains is empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: [],
      autoReplyOptions: {
        autoReplyMessage: 'some message',
        autoReplySender: 'some sender',
        autoReplySubject: 'some subject',
        hasAutoReply: true,
        includeFormSummary: true,
      },
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should allow any valid email address not in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is false and allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should allow any valid email address in allowedEmailDomains when isVerifiable is false and hasAllowedEmailDomains is false and allowedEmailDomains is not empty', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: ['@example.com', '@test.gov.sg'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'volunteer-testing@test.gov.sg',
      },
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

  it('should reject email addresses if isVerifiable is true but there is no signature present', () => {
    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'valid@email.com',
      },
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

  it('should reject email addresses if isVerifiable is true but signature is invalid', () => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => false)

    const formField = generateDefaultFieldV3(BasicField.Email, {
      isVerifiable: true,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Email,
      answer: {
        value: 'valid@email.com',
        signature: 'some signature',
      },
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

  describe('validation occurs based on if the value and signature of the current response are the same as the previous response', () => {
    let authenticateSpy: jest.SpyInstance

    beforeEach(() => {
      authenticateSpy = jest
        .spyOn(
          formsgSdk.verification as unknown as VerificationMock,
          'authenticate',
        )
        .mockImplementation(() => true)
    })

    afterEach(() => {
      authenticateSpy.mockClear()
    })

    it('should validate if no previous response is present', () => {
      const formField = generateDefaultFieldV3(BasicField.Email, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        prevResponse: undefined,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
      expect(authenticateSpy).toHaveBeenCalled()
    })

    it('should not validate if the value and signature are the same as the previous response', () => {
      const formField = generateDefaultFieldV3(BasicField.Email, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        prevResponse: { ...response },
        isVisible: true,
      })
      expect(authenticateSpy).not.toHaveBeenCalled()
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should validate if the value is different from the previous response', () => {
      authenticateSpy.mockImplementation(() => false)

      const formField = generateDefaultFieldV3(BasicField.Email, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'different@email.com',
          signature: 'some signature',
        },
      })
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        prevResponse,
        isVisible: true,
      })
      expect(authenticateSpy).toHaveBeenCalled()
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should validate if the signature is different from the previous response', () => {
      const formField = generateDefaultFieldV3(BasicField.Email, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'new signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'old signature',
        },
      })
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        prevResponse,
        isVisible: true,
      })
      expect(authenticateSpy).toHaveBeenCalled()
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })
})
