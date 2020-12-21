const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
describe('Home phone number validation tests', () => {
  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: false,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer for optional field', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: false,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: true,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow empty answer for required field', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: true,
      answer: '',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
      isVisible: true,
      answer: '+6565656565',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow home numbers without "+" prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: true,
      answer: '6567772918',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
      isVisible: true,
      answer: '+6598765432',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: true,
      answer: '+441285291028',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow international numbers when field allows for it', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: true,
      answer: '+441285291028',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'homeno',
      required: true,
      allowIntlNumbers: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'homeno',
      isVisible: false,
      answer: '+441285291028',
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
