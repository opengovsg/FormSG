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

  it('should allow valid sg home numbers starting with 666 for homeno fieldType', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+6566634424',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid sg home numbers starting with 3 for homeno fieldType', () => {
    const formField = generateDefaultField(BasicField.HomeNo)
    const response = generateNewSingleAnswerResponse(BasicField.HomeNo, {
      answer: '+6536634424',
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

describe('Home number field validation V4', () => {
  const makeHomeNoResponseV4 = (answer: {
    value: string
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.HomeNo,
      question: 'Home number',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow empty answer for required field that is not visible', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer for not required field', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo, {
      required: false,
    })
    const response = makeHomeNoResponseV4({ value: '' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow empty answer for required field', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo, {
      required: true,
    })
    const response = makeHomeNoResponseV4({ value: '' })
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

  it('should allow valid home numbers for homeno fieldType', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '+6563334444' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid sg home numbers starting with 666 for homeno fieldType', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '+6566634424' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid sg home numbers starting with 3 for homeno fieldType', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '+6536634424' })
    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow home numbers without "+" prefix', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '6563334444' })
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

  it('should disallow mobile numbers on homeno fieldType', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo)
    const response = makeHomeNoResponseV4({ value: '+6598765432' })
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

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo, {
      allowIntlNumbers: false,
    })
    const response = makeHomeNoResponseV4({ value: '+441285291028' })

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

  it('should allow international numbers when field allows for it', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo, {
      allowIntlNumbers: true,
    })
    const response = makeHomeNoResponseV4({ value: '+441285291028' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV4(BasicField.HomeNo, {
      required: true,
    })
    const response = makeHomeNoResponseV4({ value: '+6563334444' })

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
