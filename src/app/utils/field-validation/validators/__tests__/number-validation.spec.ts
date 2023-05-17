import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import {
  BasicField,
  NumberSelectedValidation,
} from '../../../../../../shared/types'

describe('Number field validation', () => {
  it('should allow number with valid maximum', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Max,
        customVal: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '5',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid maximum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Max,
        customVal: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid maximum', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Max,
        customVal: 2,
      },
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

  it('should allow number with valid minimum', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Min,
        customVal: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '555',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid minimum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Min,
        customVal: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid exact', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Exact,
        customVal: 2,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid exact', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Exact,
        customVal: 2,
      },
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

  it('should allow number with maximum left undefined', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Max,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with minimum left undefined', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Min,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with exact undefined', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: NumberSelectedValidation.Exact,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with no custom validation', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '55',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with optional answer', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
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
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '0',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow negative answers', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
    })
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
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Number, {
      answer: '05',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Number, {
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
    })
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
