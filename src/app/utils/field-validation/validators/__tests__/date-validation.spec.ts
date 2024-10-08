import {
  generateDefaultField,
  generateGenericStringAnswerResponseV3,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import {
  BasicField,
  DateSelectedValidation,
  InvalidDaysOptions,
} from '../../../../../../shared/types'

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
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.NoPast,
        customMaxDate: null,
        customMinDate: null,
      },
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
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.NoFuture,
        customMaxDate: null,
        customMinDate: null,
      },
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
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
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
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
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
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
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

  it('should allow dates if invalid day array is empty', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '26 Jul 2022',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow dates that is not an invalid day', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [
        InvalidDaysOptions.Saturday,
        InvalidDaysOptions.Sunday,
        InvalidDaysOptions.Monday,
        InvalidDaysOptions.Tuesday,
        InvalidDaysOptions.Wednesday,
        InvalidDaysOptions.Thursday,
      ],
    })
    const response = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '29 Jul 2022', // Friday
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow dates that is an invalid day', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [InvalidDaysOptions.Wednesday, InvalidDaysOptions.Thursday],
    })
    const mockWedResponse = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '27 Jul 2022',
    })

    const validateWedResult = validateField(
      'formId',
      formField,
      mockWedResponse,
    )
    expect(validateWedResult.isErr()).toBe(true)
    expect(validateWedResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )

    const mockThursResponse = generateNewSingleAnswerResponse(BasicField.Date, {
      answer: '28 Jul 2022',
    })

    const validateThursResult = validateField(
      'formId',
      formField,
      mockThursResponse,
    )
    expect(validateThursResult.isErr()).toBe(true)
    expect(validateThursResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})

describe('Date field validation V3', () => {
  beforeAll(() => {
    Date.now = jest.fn(() => new Date('2020-01-01').valueOf())
  })
  afterAll(() => {
    jest.clearAllMocks()
  })
  it('should allow valid date <DD/MM/YYYY>', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/01/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultField(BasicField.Date, { required: false })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow valid leap year date', () => {
    const formField = generateDefaultField(BasicField.Date, { required: false })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '29/02/2016',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow 00 date', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '00/01/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date less than 2 char', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '9/01/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date more than 2 char', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '009/01/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow date not in month', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '39/01/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid month', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/13/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow month less then 2 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/1/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow month more then 2 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/001/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow text year', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/01/beans',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow year less than 4 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/01/19',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow year more than 4 chars', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '09/01/02019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultField(BasicField.Date, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid leap year date', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '29/02/2019',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow past dates for normal date fields', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '01/01/2017',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow past dates if disallow past dates is not set', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '01/01/2017',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow past dates if disallow past dates is set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.NoPast,
        customMaxDate: null,
        customMinDate: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '01/01/2017',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow future dates if disallow future dates is not set', () => {
    const formField = generateDefaultField(BasicField.Date)
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '01/01/2022',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow future dates if disallow future dates is set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.NoFuture,
        customMaxDate: null,
        customMinDate: null,
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '01/01/2022',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow dates inside of Custom Date Range if set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '26/06/2020',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow dates earlier than Custom Date Range if set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '22/06/2020',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow dates later than of Custom Date Range if set', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '22/07/2020',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: DateSelectedValidation.Custom,
        customMinDate: new Date('2020-06-25'),
        customMaxDate: new Date('2020-06-28'),
      },
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '26/06/2020',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })

  it('should allow dates if invalid day array is empty', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [],
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '26/07/2020',
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow dates that is not an invalid day', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [
        InvalidDaysOptions.Saturday,
        InvalidDaysOptions.Sunday,
        InvalidDaysOptions.Monday,
        InvalidDaysOptions.Tuesday,
        InvalidDaysOptions.Wednesday,
        InvalidDaysOptions.Thursday,
      ],
    })
    const mockFriResponse = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '29/07/2022', // Friday
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response: mockFriResponse,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow dates that is an invalid day', () => {
    const formField = generateDefaultField(BasicField.Date, {
      dateValidation: {
        selectedDateValidation: null,
        customMinDate: null,
        customMaxDate: null,
      },
      invalidDays: [InvalidDaysOptions.Wednesday, InvalidDaysOptions.Thursday],
    })
    const mockWedResponse = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '27/07/2022', // Wednesday
    })

    const validateWedResult = validateFieldV3({
      formId: 'formId',
      formField,
      response: mockWedResponse,
      isVisible: true,
    })
    expect(validateWedResult.isErr()).toBe(true)
    expect(validateWedResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )

    const mockThursResponse = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.Date,
      answer: '28/07/2022', // Thursday
    })

    const validateThursResult = validateFieldV3({
      formId: 'formId',
      formField,
      response: mockThursResponse,
      isVisible: true,
    })
    expect(validateThursResult.isErr()).toBe(true)
    expect(validateThursResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })
})
