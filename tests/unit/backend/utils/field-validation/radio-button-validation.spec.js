const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')
const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})
