import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateGenericStringAnswerResponseV3,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import { BasicField } from '../../../../../../shared/types'

describe('Decimal Validation', () => {
  it('should allow decimal with valid maximum', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '4',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow decimal with valid maximum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '5',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow decimal with invalid maximum', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '6',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow decimal with valid minimum', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '5',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow decimal with valid minimum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '2',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow decimal with invalid minimum', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '1',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow decimal with no custom validation', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer with optional field', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow answer to be zero', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '0',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow negative answers', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '-5.0',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow leading zeroes', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '001.3',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow decimal points with no leading numbers', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '.3',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow negative answers with no leading number', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '-.3',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats (<16 decimal places) that are out of range (min)', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '1.999999999999999',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats (<16 decimal places) that are out of range (max)', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '2.000000000000001',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats less than 0 when customMin is 0', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 0,
        customMax: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '-0.2',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
  it('should disallow floats more than 0 when customMax is 0', () => {
    const formField = generateDefaultField(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 0,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '0.1',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Decimal)
    const response = generateNewSingleAnswerResponse(BasicField.Decimal, {
      answer: '3',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})

describe('Decimal Validation V3', () => {
  it('should allow decimal with valid maximum', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '4',
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

  it('should allow decimal with valid maximum (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '5',
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

  it('should disallow decimal with invalid maximum', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '6',
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

  it('should allow decimal with valid minimum', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '5',
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

  it('should allow decimal with valid minimum (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '2',
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

  it('should disallow decimal with invalid minimum', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '1',
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

  it('should allow decimal with no custom validation', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '55',
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

  it('should allow empty answer with optional field', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      required: false,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '',
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

  it('should allow answer to be zero', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '0',
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

  it('should allow negative answers', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '-5.0',
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

  it('should disallow leading zeroes', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '001.3',
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

  it('should disallow decimal points with no leading numbers', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '.3',
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

  it('should disallow negative answers with no leading number', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '-.3',
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

  it('should disallow floats (<16 decimal places) that are out of range (min)', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '1.999999999999999',
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

  it('should disallow floats (<16 decimal places) that are out of range (max)', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 2,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '2.000000000000001',
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

  it('should disallow floats less than 0 when customMin is 0', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: 0,
        customMax: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '-0.2',
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
  it('should disallow floats more than 0 when customMax is 0', () => {
    const formField = generateDefaultFieldV3(BasicField.Decimal, {
      ValidationOptions: {
        customMin: null,
        customMax: 0,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '0.1',
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
    const formField = generateDefaultFieldV3(BasicField.Decimal)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Decimal,
      answer: '3',
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
})
