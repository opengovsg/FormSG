const validateField = require('../../../../../dist/backend/app/utils/field-validation')

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
      isVisible: false,
      answer: '5',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '555',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
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
      isVisible: false,
      answer: '555',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '5',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '55',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '0',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
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
      isVisible: false,
      answer: '-5',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
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
      isVisible: false,
      answer: '05',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })
})
