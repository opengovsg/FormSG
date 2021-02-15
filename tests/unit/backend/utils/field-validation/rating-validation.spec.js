const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')
const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
describe('Rating field validation', () => {
  it('should allow answer within range', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '4',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid maximum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid maximum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '6',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow number with valid minimum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '1',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with optional answer', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: false,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow negative answers', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      isVisible: true,
      fieldType: 'rating',
      answer: '-1',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow leading zeroes in answer', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'rating',
      isVisible: true,
      answer: '03',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer if optional', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: false,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'rating',
      isVisible: true,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer if required', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'rating',
      isVisible: true,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'rating',
      required: true,
      ratingOptions: {
        steps: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'rating',
      isVisible: false,
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
