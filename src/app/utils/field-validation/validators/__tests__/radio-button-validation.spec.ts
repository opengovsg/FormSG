import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewSingleAnswerResponse,
  generateRadioResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

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

describe('Radio button validation V3', () => {
  it('should allow valid field option', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: 'a',
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

  it('should disallow invalid field option', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: 'invalid',
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

  it('should disallow empty answer when required and is visible', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: '',
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

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: false,
    })
    const response = generateRadioResponseV3({
      value: '',
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

  it('should allow empty answer when required and not visible', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: '',
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

  it('should disallow empty answer when required and visible', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: '',
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

  it('should disallow empty othersInput answer when others is selected if required', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: true,
      othersRadioButton: true,
    })
    const response = generateRadioResponseV3({
      othersInput: '',
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

  it(`should allow othersInput when others option is selected`, () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const response = generateRadioResponseV3({
      othersInput: 'hi i am others',
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

  it(`should disallow othersInput when others option is not selected`, () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: false,
    })
    const response = generateRadioResponseV3({
      othersInput: 'hi i am others',
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

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = generateRadioResponseV3({
      value: 'a',
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

    const formFieldOthers = generateDefaultFieldV3(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const responseOthers = generateRadioResponseV3({
      othersInput: 'cool beans',
    })

    const validateResultOthers = validateFieldV3({
      formId: 'formId',
      formField: formFieldOthers,
      response: responseOthers,
      isVisible: false,
    })
    expect(validateResultOthers.isErr()).toBe(true)
    expect(validateResultOthers._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
