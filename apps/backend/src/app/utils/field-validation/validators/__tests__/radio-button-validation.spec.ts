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

describe('Radio button field validation V4', () => {
  const makeRadioResponseV4 = (answer: {
    value: string
    isOthersInput: boolean
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Radio,
      question: 'Radio',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow valid field option', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({ value: 'a', isOthersInput: false })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid field option', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({
      value: 'invalid',
      isOthersInput: false,
    })

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

  it('should disallow empty answer when required and is visible', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({ value: '', isOthersInput: false })

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
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: false,
    })
    const response = makeRadioResponseV4({ value: '', isOthersInput: false })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer when required and not visible', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({ value: '', isOthersInput: false })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer when required and visible', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({ value: '', isOthersInput: false })

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

  it('should disallow empty othersInput answer when others is selected if required', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      required: true,
      othersRadioButton: true,
    })
    const response = makeRadioResponseV4({ value: '', isOthersInput: true })

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

  it(`should allow othersInput when others option is selected`, () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const response = makeRadioResponseV4({
      value: 'hi i am others',
      isOthersInput: true,
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

  it(`should disallow othersInput when others option is not selected`, () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: false,
    })
    const response = makeRadioResponseV4({
      value: 'hi i am others',
      isOthersInput: true,
    })

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

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
    })
    const response = makeRadioResponseV4({ value: 'a', isOthersInput: false })

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

    const formFieldOthers = generateDefaultFieldV4(BasicField.Radio, {
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    })
    const responseOthers = makeRadioResponseV4({
      value: 'cool beans',
      isOthersInput: true,
    })

    const validateResultOthers = validateFieldV4({
      formId: 'formId',
      formField: formFieldOthers,
      response: responseOthers,
      isVisible: false,
    })
    expect(validateResultOthers.isErr()).toBe(true)
    expect(validateResultOthers._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4(
        'Attempted to submit response on a hidden field',
      ),
    )
  })
})
