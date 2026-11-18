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

describe('Yes/No field validation', () => {
  it('should allow yes', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Yes',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow no', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid input', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Some answer',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})

describe('YesNo field validation V4', () => {
  const makeYesNoResponseV4 = (answer: {
    value: string
  }): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.YesNo,
      question: 'Yes/No',
      answer,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should allow Yes', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo)
    const response = makeYesNoResponseV4({ value: 'Yes' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow No', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo)
    const response = makeYesNoResponseV4({ value: 'No' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo, {
      required: false,
    })
    const response = makeYesNoResponseV4({ value: '' })

    const validateResult = validateFieldV4({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo, {
      required: true,
    })
    const response = makeYesNoResponseV4({ value: '' })

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

  it('should disallow invalid input', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo, {
      required: true,
    })
    const response = makeYesNoResponseV4({ value: 'Some answer' })

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

  it('should perform validation and disallow invalid field even when not required', () => {
    const formField = generateDefaultFieldV4(BasicField.YesNo, {
      required: false,
    })
    const response = makeYesNoResponseV4({ value: 'Some answer' })

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
    const formField = generateDefaultFieldV4(BasicField.YesNo)
    const response = makeYesNoResponseV4({ value: 'No' })

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
