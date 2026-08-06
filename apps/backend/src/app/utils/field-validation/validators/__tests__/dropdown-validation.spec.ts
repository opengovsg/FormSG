import {
  generateDefaultField,
  generateDefaultFieldV4,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'formsg-shared/types'

import {
  ValidateFieldError,
  ValidateFieldErrorV4,
} from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV4 } from 'src/app/utils/field-validation'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

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

describe('Dropdown field validation V4', () => {
  const makeDropdownResponseV4 = (answer: {
    value: string
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Dropdown,
      question: 'Dropdown',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow valid option', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = makeDropdownResponseV4({ value: 'KISS' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid option', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = makeDropdownResponseV4({ value: 'invalid' })
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

  it('should disallow empty answer when required', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    })
    const response = makeDropdownResponseV4({ value: '' })
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

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: false,
    })
    const response = makeDropdownResponseV4({ value: '' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer when it is required but not visible', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    })
    const response = makeDropdownResponseV4({ value: '' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer when it is required and visible', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    })
    const response = makeDropdownResponseV4({ value: '' })
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

  it('should disallow multiple answers', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    })
    const response = makeDropdownResponseV4({
      value: ['KISS', 'DRY'] as unknown as string,
    })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Response has invalid shape'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV4(BasicField.Dropdown, {
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    })
    const response = makeDropdownResponseV4({ value: 'KISS' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4(
        'Attempted to submit response on a hidden field',
      ),
    )
  })
})
