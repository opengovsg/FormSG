import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateGenericStringAnswerResponseV3,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import {
  BasicField,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
  NumberValidationOptions,
} from '../../../../../../shared/types'

describe('Base number field validation', () => {
  it('should allow number with no custom validation', () => {
    const formField = generateDefaultField(BasicField.Number)
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with optional answer', () => {
    const formField = generateDefaultField(BasicField.Number, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow answer to be zero', () => {
    const formField = generateDefaultField(BasicField.Number)
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '0',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow negative answers', () => {
    const formField = generateDefaultField(BasicField.Number)
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '-55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow leading zeroes in answer', () => {
    const formField = generateDefaultField(BasicField.Number)
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '05',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Number)
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '2',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})

describe('Number field validation', () => {
  it('should allow number with valid maximum length', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '5',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid maximum length (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid maximum length', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '555',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow number with valid minimum length', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Min,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '555',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid minimum length (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Min,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid exact length', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Exact,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid exact length', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Exact,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '5',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})

describe('Range field validation', () => {
  it('should allow number with that is within range (both min and max)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 5,
          customMax: 10,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '7',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with that is within maximum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: null,
          customMax: 7,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '7',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with that is within minimum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 9,
          customMax: null,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '9',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number that is below minimum', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 100,
          customMax: null,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '42',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow number that is above maximum', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: null,
          customMax: 7,
        },
      } as NumberValidationOptions,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '42',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})

describe('Base number field validation V3', () => {
  it('should allow number with no custom validation', () => {
    const formField = generateDefaultFieldV3(BasicField.Number)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should allow number with optional answer', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      required: false,
    })

    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      required: false,
    })

    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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
    const formField = generateDefaultFieldV3(BasicField.Number)

    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should disallow negative answers', () => {
    const formField = generateDefaultFieldV3(BasicField.Number)

    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '-55',
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

  it('should allow leading zeroes in answer', () => {
    const formField = generateDefaultFieldV3(BasicField.Number)

    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '05',
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
    const formField = generateDefaultFieldV3(BasicField.Number)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '2',
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

describe('Number field validation V3', () => {
  it('should allow number with valid maximum length', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should allow number with valid maximum length (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should disallow number with invalid maximum length', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Max,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '555',
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

  it('should allow number with valid minimum length', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Min,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '555',
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

  it('should allow number with valid minimum length (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Min,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should allow number with valid exact length', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Exact,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
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

  it('should disallow number with invalid exact length', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Length,
        LengthValidationOptions: {
          selectedLengthValidation: NumberSelectedLengthValidation.Exact,
          customVal: 2,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '5',
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
})

describe('Range field validation V3', () => {
  it('should allow number with that is within range (both min and max)', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 5,
          customMax: 10,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '7',
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

  it('should allow number with that is within maximum (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: null,
          customMax: 7,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '7',
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

  it('should allow number with that is within minimum (inclusive)', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 9,
          customMax: null,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '9',
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

  it('should disallow number that is below minimum', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: 100,
          customMax: null,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '42',
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

  it('should disallow number that is above maximum', () => {
    const formField = generateDefaultFieldV3(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Range,
        RangeValidationOptions: {
          customMin: null,
          customMax: 7,
        },
      } as NumberValidationOptions,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Number,
      answer: '42',
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
})
