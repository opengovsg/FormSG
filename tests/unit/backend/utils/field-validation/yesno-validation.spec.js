const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

describe('Yes/No field validation', () => {
  it('should allow yes', () => {
    const response = {
      _id: 'abc123',
      fieldType: 'yes_no',
      answer: 'Yes',
    }
    const formField = {
      _id: 'abc123',
      fieldType: 'yes_no',
      required: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow no', () => {
    const response = {
      _id: 'abc123',
      fieldType: 'yes_no',
      answer: 'No',
    }
    const formField = {
      _id: 'abc123',
      fieldType: 'yes_no',
      required: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow empty string when not required', () => {
    const response = {
      _id: 'abc123',
      fieldType: 'yes_no',
      answer: '',
    }
    const formField = {
      _id: 'abc123',
      fieldType: 'yes_no',
      required: false,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow empty string when required', () => {
    const response = {
      _id: 'abc123',
      fieldType: 'yes_no',
      answer: '',
      isVisible: true,
    }
    const formField = {
      _id: 'abc123',
      fieldType: 'yes_no',
      required: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow invalid input', () => {
    const response = {
      _id: 'abc123',
      fieldType: 'yes_no',
      answer: 'somethingRandom',
    }
    const formField = {
      _id: 'abc123',
      fieldType: 'yes_no',
      required: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })
})
