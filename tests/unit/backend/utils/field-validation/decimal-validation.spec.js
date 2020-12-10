const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')

describe('Decimal Validation', () => {
  it('should allow decimal with valid maximum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '4',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow decimal with valid maximum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow decimal with invalid maximum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: null,
        customMax: 5,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '6',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow decimal with valid minimum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow decimal with valid minimum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '2',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow decimal with invalid minimum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '1',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow decimal with no custom validation', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer with optional field', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow answer to be zero', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '0',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow negative answers', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '-5.0',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow leading zeroes', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '001.3',
    }

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow decimal points with no leading numbers', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '.3',
    }

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow negative answers with no leading number', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '-.3',
    }

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats (<16 decimal places) that are out of range (min)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: 2,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '1.999999999999999',
    }

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats (<16 decimal places) that are out of range (max)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: false,
      ValidationOptions: {
        customMin: null,
        customMax: 2,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '2.000000000000001',
    }

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow floats less than 0 when customMin is 0', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: 0,
        customMax: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '-0.2',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
  it('should disallow floats more than 0 when customMax is 0', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'decimal',
      required: true,
      ValidationOptions: {
        customMin: null,
        customMax: 0,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'decimal',
      isVisible: true,
      answer: '0.1',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})
