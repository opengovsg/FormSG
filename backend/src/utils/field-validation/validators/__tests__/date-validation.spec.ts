import { ValidateFieldError } from '@root/modules/submission/submission.errors'
import { validateField } from 'utils/field-validation'
import { BasicField } from '@root/types'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

describe('Date field validation', () => {
  beforeAll(() => {
    Date.now = jest.fn(() => new Date('2020-01-01').valueOf())
  })
  afterAll(() => {
    jest.clearAllMocks()
  })
  it('should allow valid date <DD MMM YYYY>', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultField(BasicField.Date, { required: false })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid leap year date', () => {
    const formField = generateDefaultField(BasicField.Date, { required: false })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '29 Feb 2016',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow 00 date', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '00 Jan 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date less than 2 char', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '9 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date more than 2 char', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '009 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date not in month', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '39 Jan 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid month', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jon 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow month less then 3 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jn 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow month more then 3 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 June 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow text year', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jan hello',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow year less than 4 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jan 201',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow year more than 4 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jan 02019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid leap year date', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '29 Feb 2019',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow past dates for normal date fields', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '09 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow past dates if disallow past dates is not set', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '01 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow past dates if disallow past dates is set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: { selectedDateValidation: 'Disallow past dates' },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '9 Jan 2019',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow future dates if disallow future dates is not set', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '01 Jan 2022',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow future dates if disallow future dates is set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: { selectedDateValidation: 'Disallow future dates' },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '01 Jan 2022',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow dates inside of Custom Date Range if set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: 'Custom date range',
        customMinDate: '2020-06-25',
        customMaxDate: '2020-06-28',
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '26 Jun 2020',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow dates outside of Custom Date Range if set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: 'Custom date range',
        customMinDate: '2020-06-25',
        customMaxDate: '2020-06-28',
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '22 Jun 2020',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: 'Custom date range',
        customMinDate: '2020-06-25',
        customMaxDate: '2020-06-28',
      },
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '26 Jun 2020',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
