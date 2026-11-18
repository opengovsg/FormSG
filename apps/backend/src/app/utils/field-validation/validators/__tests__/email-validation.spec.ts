import { generateDefaultFieldV4 } from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'formsg-shared/types'

import formsgSdk from 'src/app/config/formsg-sdk'
import {
  ValidateFieldError,
  ValidateFieldErrorV4,
} from 'src/app/modules/submission/submission.errors'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { validateField, validateFieldV4 } from 'src/app/utils/field-validation'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'
import {
  FieldValidationSchema,
  IEmailFieldSchema,
  OmitUnusedValidatorProps,
} from 'src/types/field'
import { SingleAnswerFieldResponse } from 'src/types/response'

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

  it('should allow email addresses matching a wildcard domain pattern', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@*.moe.gov.sg'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'user@mail.moe.gov.sg',
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

  it('should not allow the base domain itself against a wildcard pattern', () => {
    const formField = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      globalId: 'random',
      title: 'random',
      required: true,
      isVerifiable: true,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@*.moe.gov.sg'],
    } as OmitUnusedValidatorProps<IEmailFieldSchema>
    const response = {
      _id: 'abc123',
      fieldType: BasicField.Email,
      question: 'random',
      isVisible: true,
      answer: 'user@moe.gov.sg',
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

describe('Email field validation V4', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })

  const makeEmailResponseV4 = (answer: {
    value: string
    signature?: string
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Email,
      question: 'Email',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow valid emails', () => {
    const formField = generateDefaultFieldV4(BasicField.Email)
    const response = makeEmailResponseV4({ value: 'valid@email.com' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid emails', () => {
    const formField = generateDefaultFieldV4(BasicField.Email)
    const response = makeEmailResponseV4({ value: 'invalidemail.com' })
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

  it('should allow email addresses whose email domain belongs to allowedEmailDomains', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'],
    })
    const response = makeEmailResponseV4({
      value: 'volunteer-testing@test.gov.sg',
    })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses supplied with a mixed-case domain', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@test.gov.sg'], // note: domains are always read lowercased from store
    })
    const response = makeEmailResponseV4({
      value: 'volunteer-testing@TeSt.GoV.Sg', // mixed case domain
    })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  // Regression: V4 previously used exact string equality and rejected valid
  // wildcard-domain submissions that V3 accepted. See emailValidator.ts.
  it('should allow email addresses matching a wildcard domain pattern (V4)', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@*.moe.gov.sg'],
    })
    const response = makeEmailResponseV4({ value: 'user@mail.moe.gov.sg' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow email addresses matching a multi-level wildcard subdomain (V4)', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@*.moe.gov.sg'],
    })
    const response = makeEmailResponseV4({ value: 'user@dept.mail.moe.gov.sg' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow the base domain itself against a wildcard pattern (V4)', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@*.moe.gov.sg'],
    })
    const response = makeEmailResponseV4({ value: 'user@moe.gov.sg' })
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

  it('should not allow email addresses whose email domain does not belong to allowedEmailDomains', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: false,
      hasAllowedEmailDomains: true,
      allowedEmailDomains: ['@example.com'],
    })
    const response = makeEmailResponseV4({ value: 'user@test.gov.sg' })
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

  it('should reject email addresses if isVerifiable is true but there is no signature present', () => {
    const formField = generateDefaultFieldV4(BasicField.Email, {
      isVerifiable: true,
    })
    const response = makeEmailResponseV4({ value: 'valid@email.com' })
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
})
