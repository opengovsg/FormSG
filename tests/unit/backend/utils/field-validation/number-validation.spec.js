const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')
const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
describe('Number field validation', () => {
  it('should allow number with valid maximum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Maximum',
        customMin: null,
        customMax: 2,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid maximum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Maximum',
        customMin: null,
        customMax: 2,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid maximum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Maximum',
        customMin: null,
        customMax: 2,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '555',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow number with valid minimum', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Minimum',
        customMin: 2,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '555',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid minimum (inclusive)', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Minimum',
        customMin: 2,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with valid exact', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Exact',
        customMin: null,
        customMax: null,
        customVal: 2,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow number with invalid exact', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Exact',
        customMin: null,
        customMax: null,
        customVal: 2,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow number with maximum left undefined', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Maximum',
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with minimum left undefined', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Minimum',
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with exact undefined', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: 'Exact',
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    console.log('############')
    console.log(validateResult)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with no custom validation', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: true,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '55',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow number with optional answer', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: false,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
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
      fieldType: 'number',
      required: false,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '0',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow negative answers', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: false,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '-5',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow leading zeroes in answer', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: false,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: true,
      answer: '05',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'number',
      required: false,
      ValidationOptions: {
        selectedValidation: null,
        customMin: null,
        customMax: null,
        customVal: null,
      },
    }
    const response = {
      _id: 'abc123',
      fieldType: 'number',
      isVisible: false,
      answer: '05',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
