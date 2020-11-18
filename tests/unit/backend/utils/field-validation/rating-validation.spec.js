const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isOk()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isOk()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isErr()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isOk()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isOk()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isErr()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isErr()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isOk()).toBe(true)
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
    const testFunc = validateField('formId', formField, response)
    expect(testFunc.isErr()).toBe(true)
  })
})
