const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')

describe('NRIC field validation', () => {
  it('should allow valid NRIC with S prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'S9912345A',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with T prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'T1394524H',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with F prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'F0477844T',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid NRIC with G prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'G9592927W',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid NRIC with S prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'S9912345B',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with T prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'T1394524I',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with F prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'F0477844U',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid NRIC with G prefix', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'G9592927X',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty string for optional NRIC', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: false,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: '',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string for required NRIC', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: '',
      isVisible: true,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = {
      _id: 'abc123',
      fieldType: 'nric',
      required: true,
    }
    const response = {
      _id: 'abc123',
      fieldType: 'nric',
      answer: 'S0000000X',
      isVisible: false,
    }
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
