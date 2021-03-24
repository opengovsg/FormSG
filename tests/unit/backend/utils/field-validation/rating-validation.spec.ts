import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'
import { BasicField } from 'src/types'
import { RatingShape } from 'src/types/field/ratingField'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from '../../helpers/generate-form-data'

describe('Rating field validation', () => {
  it('should allow answer within range', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '4',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid maximum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '5',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid maximum', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '6',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow number with valid minimum (inclusive)', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '1',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with optional answer', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      required: false,
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '4',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow negative answers', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '-1',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow leading zeroes in answer', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '04',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer if optional', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      required: false,
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer if required', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Rating, {
      ratingOptions: {
        steps: 5,
        shape: RatingShape.Heart,
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Rating, {
      answer: '5',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
