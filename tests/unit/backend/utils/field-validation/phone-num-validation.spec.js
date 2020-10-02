const validateField = require('../../../../../dist/backend/app/utils/field-validation')
  .default

describe('Mobile validation tests', () => {
  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow empty answer for optional field', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: false,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should not allow empty answer for required field', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: true,
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow valid mobile numbers for mobile fieldType', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '+6598765432',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow valid home numbers for homeno fieldType', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: false,
      answer: '+6565656565',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow mobile numbers without "+" prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '6598765432',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow home numbers on mobile fieldType', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '+6565656565',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow mobile numbers on homeno fieldType', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
    }

    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: false,
      answer: '+6598765432',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '+447851315617',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow international numbers when field allows for it', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'mobile',
      required: true,
      allowIntlNumbers: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'mobile',
      isVisible: false,
      answer: '+447851315617',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })
})
