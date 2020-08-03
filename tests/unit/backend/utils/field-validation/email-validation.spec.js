const validateField = require('../../../../../dist/backend/app/utils/field-validation')

describe('Email field validation', () => {
  it('should allow valid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'email',
    }
    const response = {
      _id: 'abc123',
      fieldType: 'email',
      answer: 'valid@email.com',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow invalid emails', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'email',
    }
    const response = {
      _id: 'abc123',
      fieldType: 'email',
      answer: 'invalidemail.com',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'email',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'email',
      isVisible: false,
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })
})
