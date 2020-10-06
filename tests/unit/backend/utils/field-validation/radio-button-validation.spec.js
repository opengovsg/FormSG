const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

describe('Radio button validation', () => {
  it('should allow valid option', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: 'a',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow invalid option', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: 'invalid',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should disallow empty option when it is required', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      required: true,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: '',
      isVisible: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow empty option when not required', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: '',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should allow empty option when required and that logic field is not visible', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      required: true,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: '',
      isVisible: false,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it('should disallow empty option when required and that it is visible', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      required: true,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: '',
      isVisible: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it('should allow empty option when not required and that it is visible', () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      required: false,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: '',
      isVisible: true,
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it(`should allow answer that starts with 'Others: ' when others option is selected`, () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: 'Others: hi i am others',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).not.toThrow()
  })

  it(`should disallow answer that starts with 'Others: ' when others option is not selected`, () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: false,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: 'Others: hi i am others',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })

  it(`should disallow empty answer when others option is selected`, () => {
    const formField = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      fieldOptions: ['a', 'b', 'c'],
      othersRadioButton: true,
      required: true,
    }
    const response = {
      _id: 'radioID',
      fieldType: 'radiobutton',
      answer: 'Others: ',
    }
    const testFunc = () => validateField('formId', formField, response)
    expect(testFunc).toThrow()
  })
})
