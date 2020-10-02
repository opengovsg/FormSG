const validateField = require('../../../../../dist/backend/app/utils/field-validation')
  .default

describe('Dropdown validation', () => {
  it('should allow valid option', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: 'KISS',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow invalid option', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: 'invalid',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow empty answer when required', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: '',
      isVisible: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow empty answer when not required', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: false,
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow empty answer when it is required but not visible', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: '',
      isVisible: false,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow empty answer when it is required and visible', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
      required: true,
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: '',
      isVisible: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow multiple answers', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: ['KISS', 'DRY'],
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })
})
