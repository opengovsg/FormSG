const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')

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
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
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
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Response has invalid shape'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'ddID',
      fieldType: 'dropdown',
      fieldOptions: ['KISS', 'DRY', 'YAGNI'],
    }
    const response = {
      _id: 'ddID',
      fieldType: 'dropdown',
      answer: 'KISS',
      isVisible: false,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
