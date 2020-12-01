const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')
const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})
